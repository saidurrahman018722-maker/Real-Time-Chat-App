import crypto from "crypto";
export const generateOTP = () => {
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
};

export const otpMessage = (otp) => {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>Your Verification Code</title>
<!--[if mso]>
<noscript>
<xml>
<o:OfficeDocumentSettings>
<o:PixelsPerInch>96</o:PixelsPerInch>
</o:OfficeDocumentSettings>
</xml>
</noscript>
<![endif]-->
<style>
  @media only screen and (max-width: 600px) {
    .email-wrapper { width: 100% !important; }
    .fluid-padding { padding-left: 20px !important; padding-right: 20px !important; }
    .stack-heading { font-size: 24px !important; line-height: 30px !important; }
    .otp-digits { font-size: 32px !important; letter-spacing: 8px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#0b0b0f; -webkit-font-smoothing:antialiased;">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
  Your ShopNest verification code is ready. It expires in 5 minutes.
  &#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;&#8203;&zwnj;&nbsp;
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0b0b0f;">
  <tr>
    <td align="center" style="padding: 32px 16px;">

      <table role="presentation" class="email-wrapper" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#111118; border-radius:20px; overflow:hidden; border:1px solid #232330;">

        <!-- Header / Brand -->
        <tr>
          <td style="background:linear-gradient(135deg, #12142a 0%, #1a1c3a 100%); padding: 26px 32px;" align="center">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size:22px; font-weight:800; letter-spacing:2px; color:#ffffff;">
                  SHOP<span style="color:#ff6a3d;">NEST</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Hero Icon: keypad-dot badge -->
        <tr>
          <td align="center" style="padding: 44px 32px 8px 32px;" class="fluid-padding">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" style="width:88px; height:88px; border-radius:24px; background:linear-gradient(135deg, #1a1c2a 0%, #23263a 100%); border:1px solid #2f3247;">
                  <table role="presentation" width="88" height="88" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" valign="middle">
                        <table role="presentation" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="width:9px; height:9px; border-radius:50%; background-color:#ff6a3d; padding:0;"></td>
                            <td style="width:9px;"></td>
                            <td style="width:9px; height:9px; border-radius:50%; background-color:#ff6a3d; padding:0;"></td>
                            <td style="width:9px;"></td>
                            <td style="width:9px; height:9px; border-radius:50%; background-color:#ff6a3d; padding:0;"></td>
                          </tr>
                          <tr><td colspan="5" style="height:9px;"></td></tr>
                          <tr>
                            <td style="width:9px; height:9px; border-radius:50%; background-color:#ff9d73; padding:0;"></td>
                            <td style="width:9px;"></td>
                            <td style="width:9px; height:9px; border-radius:50%; background-color:#ff9d73; padding:0;"></td>
                            <td style="width:9px;"></td>
                            <td style="width:9px; height:9px; border-radius:50%; background-color:#ff9d73; padding:0;"></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Heading -->
        <tr>
          <td align="center" class="fluid-padding" style="padding: 22px 40px 0 40px; font-family:'Segoe UI', Arial, Helvetica, sans-serif;">
            <div class="stack-heading" style="font-size:28px; line-height:34px; font-weight:800; color:#ffffff;">
              Verify Your Identity
            </div>
          </td>
        </tr>

        <!-- Body copy -->
        <tr>
          <td align="center" class="fluid-padding" style="padding: 16px 44px 0 44px; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:15px; line-height:24px; color:#a3a3b2;">
            Use the one-time password below to complete verification of your ShopNest account.
          </td>
        </tr>

        <!-- OTP Card -->
        <tr>
          <td align="center" class="fluid-padding" style="padding: 30px 44px 8px 44px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1c2a; border:1px dashed #ff6a3d; border-radius:16px;">
              <tr>
                <td align="center" style="padding: 26px 20px;">
                  <div class="otp-digits" style="font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:42px; font-weight:800; letter-spacing:14px; color:#ff6a3d; padding-left:14px;">
                    ${otp}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Expiry note -->
        <tr>
          <td align="center" class="fluid-padding" style="padding: 22px 44px 44px 44px; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:13px; line-height:20px; color:#6f6f80;">
            This code is valid for <strong style="color:#9c9cae;">5 minutes</strong>. If you didn't request this, you can safely ignore this email.
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="background-color:#0d0d13; padding: 22px 32px; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:12px; color:#4a4a58;">
            &copy; ${new Date().getFullYear()} SHOPNEST. All rights reserved.
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>
</body>
</html>

  `;
};
