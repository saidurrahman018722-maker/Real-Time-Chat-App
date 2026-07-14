import { z } from "zod";
import { prisma } from "../config/db.js";
import { redis } from "../config/redis.connect.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { generateOTP } from "../utils/opt.utils.js";
import {
  sendOTPEmail,
  sendRegistrationWelcomeEmail,
  sendVerificationLinkEmail,
} from "../services/email.service.js";
import cloudinary from "../utils/cloudinary.js";



export const UserRegistration = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userExists = await prisma.user.findUnique({ where: { email } });
    if (userExists) {
      return res.status(409).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        verified: false,
      },
    });

    // --- MICROSERVICE REFACOR: PUBLISH KAFKA EVENT ---
    try {
      // Import dynamically to avoid circular dependencies if any
      const { publishEvent } = await import('../../../shared/kafka.js');
      await publishEvent('user-events', 'UserCreated', {
        id: user.id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic || null
      });
    } catch (kafkaErr) {
      console.error('Kafka Publish Error in Registration:', kafkaErr);
    }
    // -------------------------------------------------

    await sendRegistrationWelcomeEmail(user.email, user.name);

    const otp = generateOTP();
    await sendOTPEmail(user.email, user.name, otp);

    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    await prisma.otp.create({
      data: {
        userId: user.id,
        code: hashedOtp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return res.status(201).json({
      success: true,
      message:
        "User registered successfully! Please check your email for the OTP.",
      userId: user.id,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    return res.status(500).json({ error: "Internal server error", details: error.message });
  }
};

export const OtpVerification = async (req, res) => {
  try {
    const { otp } = req.body;
    const hashedOtp = crypto.createHash("sha256").update(otp).digest("hex");

    const findOtp = await prisma.otp.findFirst({
      where: {
        code: hashedOtp,
      },
    });

    if (!findOtp) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    if (Date.now() > new Date(findOtp.expiresAt).getTime()) {
      return res.status(401).json({ message: "OTP expired" });
    }

    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: findOtp.userId },
        data: { verified: true },
      }),
      prisma.otp.delete({
        where: { id: findOtp.id },
      }),
    ]);

    req.session.userId = updatedUser.id;
    req.session.userAgent = req.headers["user-agent"] || "Unknown Device";
    req.session.ipAddress = req.ip || "Unknown IP";
    req.session.loginAt = new Date().toISOString();

    const userSetKey = `user:sessions:${updatedUser.id}`;
    await redis.sadd(userSetKey, req.sessionID);

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully! You are now logged in.",
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ error: error.errors });
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const lockoutKey = `lockout:${email}`;
    const failedAttempts = await redis.get(lockoutKey);

    if (failedAttempts && parseInt(failedAttempts) >= 15) {
      return res.status(423).json({
        message: "Account locked due to too many failed login attempts. Please communicate with customer support.",
      });
    }

    const handleFailedAttempt = async () => {
      const attempts = await redis.incr(lockoutKey);
      if (attempts === 1) {
        // Set expiry for 15 minutes (900 seconds)
        await redis.expire(lockoutKey, 900);
      }
      return res.status(401).json({
        message: "Invalid Email or Password",
      });
    };

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return await handleFailedAttempt();
    }

    if (user.verified === false) {
      return res.status(401).json({
        message: "user not verified Please verify the email first.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return await handleFailedAttempt();
    }

    // Successful login: clear lockout attempts
    await redis.del(lockoutKey);

    req.session.userId = user.id;
    req.session.userAgent = req.headers["user-agent"] || "Unknown Device";
    req.session.ipAddress = req.ip || "Unknown IP";
    req.session.loginAt = new Date().toISOString();

    const userSetKey = `user:sessions:${user.id}`;
    await redis.sadd(userSetKey, req.sessionID);

    // FORCE EXPRESS TO SAVE TO REDIS BEFORE SENDING THE RESPONSE
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res.status(500).json({ error: "Failed to save session" });
      }

      res.status(200).json({
        message: "user logged in successfully",
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          verified: user.verified,
        },
      });
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getDevices = async (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: "Unauthorized" });

  const userId = req.session.userId;
  const userSetKey = `user:sessions:${userId}`;

  const sessionIds = await redis.smembers(userSetKey);
  if (sessionIds.length === 0) return res.json({ devices: [] });

  const pipeline = redis.pipeline();
  sessionIds.forEach((id) => pipeline.get(`session:${id}`));
  const pipelineResults = await pipeline.exec();

  const activeDevices = [];

  if (pipelineResults) {
    for (let i = 0; i < sessionIds.length; i++) {
      const sessionId = sessionIds[i];
      const error = pipelineResults[i][0];
      const dataStr = pipelineResults[i][1];

      if (!error && dataStr) {
        const sessionData = JSON.parse(dataStr);
        activeDevices.push({
          sessionId: sessionId,
          userAgent: sessionData.userAgent,
          ipAddress: sessionData.ipAddress,
          loginAt: sessionData.loginAt,
          isCurrentDevice: sessionId === req.sessionID,
        });
      } else {
        await redis.srem(userSetKey, sessionId);
      }
    }
  }

  return res.json({ devices: activeDevices });
};

export const revokeDevice = async (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: "Unauthorized" });

  const userId = req.session.userId;
  const sessionIdToRevoke = req.params.id;

  await redis.del(`session:${sessionIdToRevoke}`);
  await redis.srem(`user:sessions:${userId}`, sessionIdToRevoke);

  return res.json({ message: "Device session revoked successfully" });
};

// LOGOUT
export const logout = async (req, res) => {
  if (!req.session.userId)
    return res.status(401).json({ error: "Not logged in" });

  const userId = req.session.userId;
  const currentSessionId = req.sessionID;

  await redis.srem(`user:sessions:${userId}`, currentSessionId);

  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.clearCookie("sessionId");
    return res.json({ message: "Logged out successfully" });
  });
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, profilePic } = req.body;
    const userId = req.session.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const updateData = {};
    if (name) updateData.name = name;
    
    let requireNewVerification = false;
    if (email && email !== user.email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return res
          .status(400)
          .json({ message: "This email is already in use." });
      }
      updateData.email = email;
      updateData.verified = false;
      requireNewVerification = true;
    }

    if (profilePic) {
      const cloudResponse = await cloudinary.uploader.upload(profilePic);
      updateData.profilePic = cloudResponse.secure_url;
    }
    
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No data provided to update." });
    }

    let updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    // --- MICROSERVICE REFACOR: PUBLISH KAFKA EVENT ---
    try {
      const { publishEvent } = await import('../../../shared/kafka.js');
      await publishEvent('user-events', 'UserCreated', { // We use UserCreated as Upsert in other services
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        profilePic: updatedUser.profilePic || null
      });
    } catch (kafkaErr) {
      console.error('Kafka Publish Error in UpdateProfile:', kafkaErr);
    }
    // -------------------------------------------------

    let verifyToken;
    if (requireNewVerification) {
      verifyToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto
        .createHash("sha256")
        .update(verifyToken)
        .digest("hex");
      const verifyTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          verifyToken: hashedToken,
          verifyTokenExpiry: verifyTokenExpiry,
        },
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const verificationUrl = `${frontendUrl}/verify-email/${verifyToken}`;

      await sendVerificationLinkEmail(
        updatedUser.email,
        updatedUser.name,
        verificationUrl
      );
    }

    return res.status(200).json({
      message: requireNewVerification
        ? "Profile updated. Please verify your new email address to continue."
        : "Profile updated successfully",
      user: updatedUser,
      data: { verifyToken },
    });
  } catch (error) {
    return res.status(500).json({
      message:
        "Something went wrong while uploading your porfile... Please try again later",
      error: error.message,
    });
  }
};

export const getUser = async (req, res) => {
  const userId = req.session.userId;
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });
  return res.status(200).json({
    success: true,
    message: "user logged in successfully",
    data: {
      id: userId,
      name: user.name,
      email: user.email,
      verified: user.verified,
    },
  });
};

export const verifyEmailToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, message: "Token is required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await prisma.user.findUnique({
      where: {
        verifyToken: hashedToken,
      },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired token" });
    }

    if (
      user.verifyTokenExpiry &&
      Date.now() > new Date(user.verifyTokenExpiry).getTime()
    ) {
      return res.status(400).json({ success: false, message: "Token has expired" });
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        verified: true,
        verifyToken: null,
        verifyTokenExpiry: null,
      },
    });

    return res.status(200).json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.session.userId;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Incorrect current password" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return res.status(200).json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
