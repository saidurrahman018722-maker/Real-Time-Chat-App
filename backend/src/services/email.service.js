import { config } from "dotenv";
import nodemailer from "nodemailer";
import { otpMessage } from "../utils/opt.utils.js";
import { registrationEmailHtml, verifyEmailHtml } from "../utils/email.html.js";

config();
export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    type: "OAuth2",
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error("Error connecting to email server:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

export const sendRegistrationWelcomeEmail = async (userEmail, userName) => {
  try {
    const info = await transporter.sendMail({
      from: `"SHOPNEST" <${process.env.EMAIL_USER}>`, // Change this to your app's name
      to: userEmail,
      subject: "Welcome! Registration Successful",
      text: `Hi ${userName},\n\nThank you for registering! We are thrilled to have you on board.\n\nBest,\nThe EmailSending Team`,
      // HTML version looks much better in modern email clients
      html: registrationEmailHtml(userName),
    });

    console.log("Welcome email sent successfully: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return false;
  }
};

export const sendOTPEmail = async (userEmail, userName, otp) => {
  try {
    const info = await transporter.sendMail({
      from: `"SHOPNEST" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `${otp} is your SHOPNEST verification code`,

      // Plain text fallback for old/restrictive email clients
      text: `Hi ${userName},\n\nThank you for registering with SHOPNEST. Your One-Time Password (OTP) is: ${otp}\n\nThis code is valid for 5 minutes.\n\nBest,\nSHOPNEST Team`,

      html: otpMessage(otp),
    });

    console.log("OTP email sent successfully: %s", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
};

export const sendVerificationLinkEmail = async (
  userEmail,
  userName,
  verificationUrl
) => {
  try {
    const info = await transporter.sendMail({
      from: `"SHOPNEST" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: "Verify your email address - SHOPNEST",
      text: `Hi ${userName},\n\nPlease verify your email address by clicking the following link:\n${verificationUrl}\n\nThis link will expire in 1 hour.\n\nBest,\nSHOPNEST Team`,
      html: verifyEmailHtml(userName, verificationUrl),
    });

    console.log(
      "Verification link email sent successfully: %s",
      info.messageId
    );
    return true;
  } catch (error) {
    console.error("Error sending verification link email:", error);
    return false;
  }
};
