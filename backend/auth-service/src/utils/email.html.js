export const registrationEmailHtml = (userName) => {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>Welcome to Shopnest</title>
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
    .stack-heading { font-size: 26px !important; line-height: 32px !important; }
    .feature-cell { display: block !important; width: 100% !important; padding-bottom: 16px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#0b0b0f; -webkit-font-smoothing:antialiased;">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
  You're in! One more step — check your inbox for the OTP to verify your account.
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

        <!-- Hero banner -->
        <tr>
          <td align="center" style="background:linear-gradient(135deg, #ff6a3d 0%, #ff3d2e 100%); padding: 56px 32px;" class="fluid-padding">
            <div style="font-size:38px; line-height:1; margin-bottom:14px;">💬</div>
            <div class="stack-heading" style="font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:30px; line-height:38px; font-weight:800; color:#ffffff;">
              Welcome aboard, ${userName}
            </div>
            <div style="font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:15px; color:#ffe4d9; margin-top:10px;">
              Your ShopNest account has been created
            </div>
          </td>
        </tr>

        <!-- Body copy -->
        <tr>
          <td align="center" class="fluid-padding" style="padding: 40px 44px 8px 44px; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:15px; line-height:24px; color:#a3a3b2;">
            We're really glad to have you here. ShopNest is built for conversations that actually feel fast — instant messages, clean group chats, and an experience that stays out of your way so you can just talk.
          </td>
        </tr>

        <!-- OTP notice card -->
        <tr>
          <td align="center" class="fluid-padding" style="padding: 30px 44px 8px 44px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#1a1c2a; border-radius:14px; border:1px solid #2a2c3d;">
              <tr>
                <td align="center" style="padding: 26px 30px;">
                  <div style="font-size:28px; line-height:1; margin-bottom:10px;">📩</div>
                  <div style="font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:16px; font-weight:700; color:#ffffff; margin-bottom:8px;">
                    One last step to verify you
                  </div>
                  <div style="font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:14px; line-height:22px; color:#9c9cae;">
                    We're sending a One-Time Password (OTP) to this inbox right after this email. Keep an eye out and enter it in the app to verify your account.
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding: 36px 32px 0 32px;">
            <div style="height:1px; background-color:#232330; width:100%;"></div>
          </td>
        </tr>

        <!-- Feature grid -->
        <tr>
          <td class="fluid-padding" style="padding: 32px 32px 8px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td class="feature-cell" align="center" width="33.33%" style="font-family:'Segoe UI', Arial, Helvetica, sans-serif; padding: 0 8px;">
                  <div style="width:52px; height:52px; border-radius:14px; background:#1a1c2a; margin:0 auto 12px auto;">
                    <table width="52" height="52" role="presentation"><tr><td align="center" valign="middle" style="font-size:22px;">⚡</td></tr></table>
                  </div>
                  <div style="font-size:13px; font-weight:700; color:#e8e8ee; margin-bottom:4px;">Instant Messaging</div>
                  <div style="font-size:12px; color:#6f6f80; line-height:17px;">Messages that land in real time</div>
                </td>
                <td class="feature-cell" align="center" width="33.33%" style="font-family:'Segoe UI', Arial, Helvetica, sans-serif; padding: 0 8px;">
                  <div style="width:52px; height:52px; border-radius:14px; background:#1a1c2a; margin:0 auto 12px auto;">
                    <table width="52" height="52" role="presentation"><tr><td align="center" valign="middle" style="font-size:22px;">🔒</td></tr></table>
                  </div>
                  <div style="font-size:13px; font-weight:700; color:#e8e8ee; margin-bottom:4px;">Private & Secure</div>
                  <div style="font-size:12px; color:#6f6f80; line-height:17px;">Your chats, encrypted end to end</div>
                </td>
                <td class="feature-cell" align="center" width="33.33%" style="font-family:'Segoe UI', Arial, Helvetica, sans-serif; padding: 0 8px;">
                  <div style="width:52px; height:52px; border-radius:14px; background:#1a1c2a; margin:0 auto 12px auto;">
                    <table width="52" height="52" role="presentation"><tr><td align="center" valign="middle" style="font-size:22px;">👥</td></tr></table>
                  </div>
                  <div style="font-size:13px; font-weight:700; color:#e8e8ee; margin-bottom:4px;">Group Chats</div>
                  <div style="font-size:12px; color:#6f6f80; line-height:17px;">Bring everyone into one place</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Sign-off -->
        <tr>
          <td align="center" class="fluid-padding" style="padding: 30px 44px 44px 44px; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:13px; line-height:20px; color:#6f6f80;">
            Questions, or just want to say hi? Reply to this email — it lands straight in our inbox, no bots involved.
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
</html>`;
};

export const verifyEmailHtml = (userName, verificationUrl) => {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>Verify Your Email</title>
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
    .stack-heading { font-size: 26px !important; line-height: 32px !important; }
  }

  @keyframes floatOrb {
    0%   { transform: translateY(0px) scale(1); }
    50%  { transform: translateY(-10px) scale(1.03); }
    100% { transform: translateY(0px) scale(1); }
  }

  @keyframes pulseRing {
    0%   { box-shadow: 0 0 0 0 rgba(255, 106, 61, 0.45); }
    70%  { box-shadow: 0 0 0 14px rgba(255, 106, 61, 0); }
    100% { box-shadow: 0 0 0 0 rgba(255, 106, 61, 0); }
  }

  @keyframes fadeSlideUp {
    0%   { opacity: 0; transform: translateY(14px); }
    100% { opacity: 1; transform: translateY(0); }
  }

  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .orb-anim { animation: floatOrb 3.5s ease-in-out infinite; }
  .cta-anim { animation: pulseRing 2.2s ease-out infinite; }
  .fade-1 { animation: fadeSlideUp 0.7s ease both; animation-delay: 0.05s; }
  .fade-2 { animation: fadeSlideUp 0.7s ease both; animation-delay: 0.2s; }
  .fade-3 { animation: fadeSlideUp 0.7s ease both; animation-delay: 0.35s; }
  .fade-4 { animation: fadeSlideUp 0.7s ease both; animation-delay: 0.5s; }
  .brand-shimmer {
    background: linear-gradient(90deg, #ff6a3d 0%, #ffb199 25%, #ff6a3d 50%, #ffb199 75%, #ff6a3d 100%);
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    animation: shimmer 4s linear infinite;
  }

  a.verify-btn:hover {
    filter: brightness(1.08);
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#0b0b0f; -webkit-font-smoothing:antialiased;">
<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
  Confirm it's really you — verify your ShopNest email in one tap. This link expires in 1 hour.
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
                  SHOP<span class="brand-shimmer" style="font-weight:800;">NEST</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Hero Icon -->
        <tr>
          <td align="center" style="padding: 44px 32px 8px 32px;" class="fluid-padding">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" class="orb-anim" style="width:88px; height:88px; border-radius:50%; background:radial-gradient(circle at 35% 30%, #ff8a5c, #ff5e2e 55%, #d9440f 100%); box-shadow: 0 0 0 8px rgba(255,94,46,0.08);">
                  <table role="presentation" width="88" height="88" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" valign="middle" style="font-size:34px; line-height:1;">
                        &#9993;&#65039;
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
          <td align="center" class="fade-1 fluid-padding" style="padding: 22px 40px 0 40px; font-family:'Segoe UI', Arial, Helvetica, sans-serif;">
            <div class="stack-heading" style="font-size:28px; line-height:34px; font-weight:800; color:#ffffff;">
              Let's confirm it's you
            </div>
          </td>
        </tr>

        <!-- Body copy -->
        <tr>
          <td align="center" class="fade-2 fluid-padding" style="padding: 16px 44px 0 44px; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:15px; line-height:24px; color:#a3a3b2;">
            Hey <strong style="color:#e8e8ee;">${userName}</strong>, we received a request to verify the email address on your ShopNest account. Click the button below and you're all set — takes about five seconds.
          </td>
        </tr>

        <!-- CTA Button -->
        <tr>
          <td align="center" class="fade-3" style="padding: 34px 32px 8px 32px;">
            <table role="presentation" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center" class="cta-anim" style="border-radius:12px; background:linear-gradient(135deg, #ff6a3d 0%, #ff3d2e 100%);">
                  <a href="${verificationUrl}" class="verify-btn" target="_blank"
                     style="display:inline-block; padding:16px 40px; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:16px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:12px;">
                    Verify Email Now &nbsp;&#8594;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Expiry note -->
        <tr>
          <td align="center" class="fade-4 fluid-padding" style="padding: 20px 44px 40px 44px; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:13px; line-height:20px; color:#6f6f80;">
            This link is encrypted and expires in <strong style="color:#9c9cae;">1 hour</strong>. Didn't request this? No action needed — your account stays safe.
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding: 0 32px;">
            <div style="height:1px; background-color:#232330; width:100%;"></div>
          </td>
        </tr>

        <!-- Fallback link -->
        <tr>
          <td align="center" style="padding: 24px 40px; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:12px; line-height:19px; color:#5a5a6a;">
            Button not working? Copy and paste this link into your browser:<br />
            <a href="${verificationUrl}" style="color:#ff6a3d; word-break:break-all; text-decoration:none;">${verificationUrl}</a>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="background-color:#0d0d13; padding: 22px 32px; font-family:'Segoe UI', Arial, Helvetica, sans-serif; font-size:12px; color:#4a4a58;">
            &copy; ${new Date().getFullYear()} SHOPNEST. All rights reserved.<br />
            You're receiving this because a verification was requested for this email address.
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>
</body>
</html>`;
};
