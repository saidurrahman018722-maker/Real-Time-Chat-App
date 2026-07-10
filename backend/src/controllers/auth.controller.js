import { z } from 'zod';
import {prisma} from '../config/db.js';
import {redis} from '../config/redis.connect.js'
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendOTPEmail, sendRegistrationWelcomeEmail} from '../services/email.service.js';


export const UserRegistration = async (req, res) => {
  try {
    const { name, email, password } = req.body;

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

    await sendRegistrationWelcomeEmail(user.email, user.name);
    const otp = generateOTP(); 
    await sendOTPEmail(user.email, user.name, otp);

    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    await prisma.otp.create({
      data: {
        userId: user.id,
        code: hashedOtp,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000), 
      },
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully! Please check your email for the OTP.",
      userId: user.id,
    });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const OtpVerification = async (req, res) => {
  try {
    const { otp } = req.body;
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

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

    // Update user status and delete the used OTP in a fast database transaction
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { verified: true },
      }),
      prisma.otp.delete({
        where: { id: findOtp.id },
      }),
    ]);

    req.session.userId = updatedUser.id;
    req.session.userAgent = req.headers['user-agent'] || 'Unknown Device';
    req.session.ipAddress = req.ip || 'Unknown IP';
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
    if (error instanceof z.ZodError) return res.status(400).json({ error: error.errors });
    return res.status(500).json({ error: "Internal server error" });
  }
};


export const login = async (req, res) => {
  try {
    const {email,password} = req.body;
    const user = await prisma.user.findUnique({
        where:{
            email
        }
    })
    if(!user){
        return res.status(401).json({
            message:"Invalid Email or Password"
        })
    }
    if(user.verified === false){
        return res.status(401).json({
            message:"user not verified Please verify the email first."
        })
    }
    const isMatch = await bcrypt.compare(password,user.password);
    if(!isMatch){
        return res.status(401).json({
            message:"Invalid Email or Password"
        
        })
    }
    req.session.userId = user.id;
    req.session.userAgent = req.headers['user-agent'] || 'Unknown Device';
    req.session.ipAddress = req.ip || 'Unknown IP';
    req.session.loginAt = new Date().toISOString();

    const userSetKey = `user:sessions:${user.id}`;
    await redis.sadd(userSetKey, req.sessionID);

    res.status(200).json({
        message:"user logged in successfully",
        data:{
      id:user.id,
      name:user.name,
      email:user.email,
      verified:user.verified
        }
    })     

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};


export const getDevices = async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

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
  if (!req.session.userId) return res.status(401).json({ error: 'Unauthorized' });

  const userId = req.session.userId;
  const sessionIdToRevoke = req.params.id;

  await redis.del(`session:${sessionIdToRevoke}`);
  await redis.srem(`user:sessions:${userId}`, sessionIdToRevoke);

  return res.json({ message: 'Device session revoked successfully' });
};

// LOGOUT
export const logout = async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });

  const userId = req.session.userId;
  const currentSessionId = req.sessionID;

  await redis.srem(`user:sessions:${userId}`, currentSessionId);

  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('sessionId');
    return res.json({ message: 'Logged out successfully' });
  });
};