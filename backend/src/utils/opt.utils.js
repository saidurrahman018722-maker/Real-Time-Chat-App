import crypto from 'crypto'
export const generateOTP = ()=>{
    const otp = crypto.randomInt(100000, 999999).toString();
    return otp;
}

export const otpMessage = (otp) => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Verification Code</title>
  </head>
  <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f6f9; margin: 0; padding: 20px;">
      <div class="container" style="max-width: 600px; margin: 40px auto; background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #eef2f5;">
          <div class="logo" style="font-size: 24px; font-weight: bold; color: #4F46E5; margin-bottom: 20px; text-align: center;">SHOPNEST</div>
          <div class="heading" style="font-size: 20px; font-weight: 600; color: #1F2937; margin-bottom: 10px;">Verify your identity</div>
          
          <p class="text" style="color: #4B5563; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Thank you for registering with SHOPNEST. Please use the following One-Time Password (OTP) to complete your verification. This code is valid for <strong>5 minutes</strong>.
          </p>
          
          <div class="otp-container" style="background-color: #F3F4F6; border: 1px dashed #9CA3AF; border-radius: 6px; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827; margin-bottom: 30px;">
              ${otp}
          </div>
          
          <p class="text" style="font-size: 14px; color: #6B7280; line-height: 1.6; margin-bottom: 30px;">
              If you did not request this code, please ignore this email or contact support if you have concerns.
          </p>
          
          <div class="footer" style="font-size: 12px; color: #9CA3AF; text-align: center; margin-top: 40px; border-top: 1px solid #E5E7EB; padding-top: 20px;">
              &copy; 2026 SHOPNEST Inc. All rights reserved.
          </div>
      </div>
  </body>
  </html>
  `;
};


