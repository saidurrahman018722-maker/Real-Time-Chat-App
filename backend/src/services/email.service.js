import { config } from 'dotenv';
import nodemailer from 'nodemailer';
import { otpMessage } from "../utils/opt.utils.js"

config();
export const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: process.env.EMAIL_USER,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN,
  },
});

// Verify the connection configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Error connecting to email server:', error);
  } else {
    console.log('Email server is ready to send messages');
  }
});


// Function to send email
export  const sendRegistrationWelcomeEmail = async (userEmail, userName) => {
  try {
    const info = await transporter.sendMail({
      from: `"SHOPNEST" <${process.env.EMAIL_USER}>`, // Change this to your app's name
      to: userEmail,
      subject: 'Welcome! Registration Successful',
      text: `Hi ${userName},\n\nThank you for registering! We are thrilled to have you on board.\n\nBest,\nThe EmailSending Team`,
      // HTML version looks much better in modern email clients
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px; background-color: #f9f9f9;">
          <h2 style="color: #4CAF50;">Welcome aboard, ${userName}!</h2>
          <p style="font-size: 16px; color: #333;">Your account has been successfully created. We are absolutely thrilled to have you with us.</p>
          <p style="font-size: 16px; color: #333;">If you have any questions or need help getting started, just hit reply to this email!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 14px; color: #777;">Best Regards,<br><strong> EmailSending Team</strong></p>
        </div>
      `,
    });

    console.log('Welcome email sent successfully: %s', info.messageId);
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
      
      // Passing your modular HTML function here
      html: otpMessage(otp), 
    });

    console.log('OTP email sent successfully: %s', info.messageId);
    return true; 
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
};


export const sendOrderConfirmationEmail = async (userEmail, userName, orderId, totalAmount) => {
  try {
    const info = await transporter.sendMail({
      from: `"SHOPNEST" <${process.env.EMAIL_USER}>`, 
      to: userEmail,
      subject: 'Order Confirmed - Thank you for your purchase!',
      
      // Fallback plain text for email clients that don't support HTML
      text: `Hi ${userName},\n\nThank you for shopping with SHOPNEST! We have received your order (ID: ${orderId}). Your total is $${totalAmount.toFixed(2)}.\n\nBest,\nThe SHOPNEST Team`,
      
      // The fully matched HTML template
      html: `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Order Confirmed</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px;">
            <div class="container" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #eef2f5;">
                
                <div class="logo" style="font-size: 24px; font-weight: bold; color: #4F46E5; margin-bottom: 20px; text-align: center;">SHOPNEST</div>
                
                <div class="heading" style="font-size: 20px; font-weight: 600; color: #1F2937; margin-bottom: 10px;">Order Confirmed! 🎉</div>
                
                <p class="text" style="color: #4B5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                    Hi ${userName},<br><br>
                    Thank you for shopping with SHOPNEST. We've successfully received your order and are getting it ready for shipment right now.
                </p>
                
                <div class="order-details-container" style="background-color: #F3F4F6; border: 1px dashed #9CA3AF; border-radius: 6px; padding: 20px; text-align: center; color: #111827; margin-bottom: 30px;">
                    <p style="margin: 0 0 10px 0; font-size: 18px;"><strong>Order ID:</strong> ${orderId}</p>
                    <p style="margin: 0; font-size: 18px; color: #4F46E5;"><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
                </div>
                
                <p class="text" style="font-size: 14px; color: #6B7280; line-height: 1.6; margin-bottom: 30px;">
                    We will send you another email as soon as your order ships. If you have any questions or need to make changes, just reply directly to this email!
                </p>
                
                <div class="footer" style="font-size: 12px; color: #9CA3AF; text-align: center; margin-top: 40px; border-top: 1px solid #E5E7EB; padding-top: 20px;">
                    &copy; 2026 SHOPNEST Inc. All rights reserved.
                </div>
                
            </div>
        </body>
        </html>
      `,
    });

    console.log('Order confirmation email sent successfully: %s', info.messageId);
    return true; 
    
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    return false;
  }
};
