export interface LicenseDeliveryTemplateParams {
  customerName?: string;
  customerEmail: string;
  productName: string;
  licenseKey: string;
  instructionsUrl: string;
  downloadUrl: string;
  orderToken: string;
}

export function renderLicenseDeliveryEmail(params: LicenseDeliveryTemplateParams): {
  subject: string;
  text: string;
  html: string;
} {
  const {
    customerName,
    productName,
    licenseKey,
    instructionsUrl,
    downloadUrl,
    orderToken,
  } = params;

  const greeting = customerName ? `Hello ${customerName},` : 'Hello,';

  const subject = `[Nav Brahmi] Your License Key for ${productName}`;

  const text = `${greeting}

Thank you for purchasing Nav Brahmi: ${productName}.

Your license key has been generated:
----------------------------------------
License Key: ${licenseKey}
----------------------------------------

INSTALLATION INSTRUCTIONS:
1. Review step-by-step installation instructions:
   ${instructionsUrl}

2. Download your Windows installer:
   ${downloadUrl}

3. Run Setup.exe, accept administrator permissions, and enter your license key when prompted.
4. Press Win + Space to toggle and start typing in ${productName}.

Order Reference: ${orderToken}

Support: If you have any questions or require assistance, contact us at support@brahmicomputing.in.

—
Nav Brahmi Computing Technologies
https://brahmicomputing.in
`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #231F20; background-color: #F8F9FA; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 8px; border: 1px solid #E5E7EB; overflow: hidden;">
    <div style="background-color: #E51055; padding: 24px 32px; color: #FFFFFF;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #FFFFFF;">Nav Brahmi</h1>
      <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9; color: #FFFFFF;">Official Software License Delivery</p>
    </div>
    <div style="padding: 32px;">
      <p style="margin-top: 0;">${greeting}</p>
      <p>Thank you for purchasing <strong>${productName}</strong>. Your official license key is ready for activation.</p>

      <div style="background-color: #F8F9FA; border: 1px solid #E5E7EB; border-left: 4px solid #E51055; padding: 16px; margin: 24px 0; border-radius: 4px;">
        <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6B7280; margin-bottom: 6px;">Your License Key</div>
        <div style="font-family: monospace; font-size: 18px; font-weight: bold; color: #231F20; letter-spacing: 0.08em;">${licenseKey}</div>
      </div>

      <h2 style="font-size: 16px; font-weight: 600; margin: 24px 0 12px; color: #231F20;">Next Steps</h2>
      <ol style="padding-left: 20px; margin-bottom: 24px;">
        <li style="margin-bottom: 8px;">
          <a href="${instructionsUrl}" style="color: #0066CC; text-decoration: underline; font-weight: 600;">Read the Installation Guide</a> for Windows prerequisites and setup steps.
        </li>
        <li style="margin-bottom: 8px;">
          <a href="${downloadUrl}" style="color: #0066CC; text-decoration: underline; font-weight: 600;">Download the Windows Installer</a>.
        </li>
        <li style="margin-bottom: 8px;">Run <code>Setup.exe</code> with administrator permissions and enter your license key.</li>
        <li>Switch between languages at any time using <strong>Win + Space</strong>.</li>
      </ol>

      <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; font-size: 12px; color: #6B7280;">
        <p style="margin: 0 0 4px;">Order Token: <code>${orderToken}</code></p>
        <p style="margin: 0;">Need help? Contact <a href="mailto:support@brahmicomputing.in" style="color: #0066CC;">support@brahmicomputing.in</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

export interface LicenseRecoveryTemplateParams {
  customerEmail: string;
  recoveryUrl: string;
  expiresInMinutes?: number;
}

export function renderLicenseRecoveryEmail(params: LicenseRecoveryTemplateParams): {
  subject: string;
  text: string;
  html: string;
} {
  const { recoveryUrl, expiresInMinutes = 30 } = params;

  const subject = '[Nav Brahmi] Your Software License Recovery Link';

  const text = `Hello,

A license recovery request was initiated for your Nav Brahmi purchase.

To access your purchased software licenses, please click the secure recovery link below:
${recoveryUrl}

SECURITY NOTICE:
- This link is single-use and valid for ${expiresInMinutes} minutes only.
- If you did not request license recovery, you can safely disregard this email. Your licenses and machine activations remain protected.
- In accordance with our security policy, machine activations are NOT reset during license recovery.

Need assistance? Contact support at support@brahmicomputing.in.

—
Nav Brahmi Computing Technologies
https://brahmicomputing.in
`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #231F20; background-color: #F8F9FA; margin: 0; padding: 24px;">
  <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 8px; border: 1px solid #E5E7EB; overflow: hidden;">
    <div style="background-color: #E51055; padding: 24px 32px; color: #FFFFFF;">
      <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #FFFFFF;">Nav Brahmi</h1>
      <p style="margin: 4px 0 0; font-size: 14px; opacity: 0.9; color: #FFFFFF;">Secure License Recovery</p>
    </div>
    <div style="padding: 32px;">
      <p style="margin-top: 0;">Hello,</p>
      <p>A license recovery request was received for your Nav Brahmi software purchase.</p>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${recoveryUrl}" style="background-color: #E51055; color: #FFFFFF; padding: 14px 28px; text-decoration: none; font-weight: 600; border-radius: 6px; display: inline-block;">
          Access Your Licenses
        </a>
      </div>

      <div style="background-color: #F8F9FA; border: 1px solid #E5E7EB; padding: 16px; margin: 24px 0; border-radius: 4px; font-size: 13px; color: #4B5563;">
        <p style="margin: 0 0 8px; font-weight: 600; color: #231F20;">Security Notice:</p>
        <ul style="margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 4px;">This single-use link is valid for <strong>${expiresInMinutes} minutes</strong>.</li>
          <li style="margin-bottom: 4px;">If you did not request this, you can safely ignore this message.</li>
          <li>Existing machine activations are not modified or reset during recovery.</li>
        </ul>
      </div>

      <p style="font-size: 13px; color: #6B7280; word-break: break-all;">
        If the button above does not work, copy and paste this URL into your browser:<br>
        <a href="${recoveryUrl}" style="color: #0066CC;">${recoveryUrl}</a>
      </p>

      <div style="border-top: 1px solid #E5E7EB; padding-top: 16px; font-size: 12px; color: #6B7280; margin-top: 32px;">
        <p style="margin: 0;">Need help? Contact <a href="mailto:support@brahmicomputing.in" style="color: #0066CC;">support@brahmicomputing.in</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}

