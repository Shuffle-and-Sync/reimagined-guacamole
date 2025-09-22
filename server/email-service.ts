import { MailService } from '@sendgrid/mail';
import { logger } from './logger';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(SENDGRID_API_KEY);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const emailData: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
    };
    
    if (params.text) emailData.text = params.text;
    if (params.html) emailData.html = params.html;
    
    await mailService.send(emailData);
    return true;
  } catch (error) {
    logger.error('Failed to send email via SendGrid', error, { to: params.to, subject: params.subject });
    return false;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string,
  baseUrl: string
): Promise<boolean> {
  const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
  
  const emailParams: EmailParams = {
    to: email,
    from: 'noreply@shuffleandsync.com', // Replace with your verified sender
    subject: 'Reset Your Password - Shuffle & Sync',
    text: `
Hello,

You requested a password reset for your Shuffle & Sync account.

Click the link below to reset your password:
${resetUrl}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

Best regards,
The Shuffle & Sync Team
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Reset Your Password</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 Shuffle & Sync</h1>
    </div>
    <div class="content">
      <h2>Reset Your Password</h2>
      <p>Hello,</p>
      <p>You requested a password reset for your Shuffle & Sync account.</p>
      <p>Click the button below to reset your password:</p>
      <a href="${resetUrl}" class="button">Reset Password</a>
      <p><strong>This link will expire in 1 hour.</strong></p>
      <p>If you didn't request this password reset, please ignore this email.</p>
      <div class="footer">
        <p>Best regards,<br>The Shuffle & Sync Team</p>
      </div>
    </div>
  </div>
</body>
</html>
    `
  };

  return await sendEmail(emailParams);
}

/**
 * Send email verification email to user
 */
export async function sendEmailVerificationEmail(
  email: string,
  verificationToken: string,
  baseUrl: string,
  userName?: string
): Promise<boolean> {
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
  const displayName = userName || 'there';
  
  const emailParams: EmailParams = {
    to: email,
    from: 'noreply@shuffleandsync.com',
    subject: 'Verify Your Email - Shuffle & Sync',
    text: `
Hello ${displayName},

Welcome to Shuffle & Sync! Please verify your email address to complete your account setup.

Click the link below to verify your email:
${verificationUrl}

This link will expire in 24 hours.

If you didn't create this account, please ignore this email.

Best regards,
The Shuffle & Sync Team
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify Your Email</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .button:hover { background: #218838; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 Shuffle & Sync</h1>
      <p style="margin: 0; font-size: 18px;">Trading Card Game Community</p>
    </div>
    <div class="content">
      <h2>Welcome, ${displayName}!</h2>
      <p>Thank you for joining Shuffle & Sync, the premier platform for trading card game streamers and content creators.</p>
      <p>To complete your account setup and start connecting with the TCG community, please verify your email address:</p>
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </div>
      <div class="warning">
        <strong>⏰ Important:</strong> This verification link will expire in 24 hours.
      </div>
      <p>Once verified, you'll be able to:</p>
      <ul>
        <li>🃏 Join your favorite TCG communities (MTG, Pokemon, Lorcana, Yu-Gi-Oh, and more)</li>
        <li>📺 Coordinate collaborative streams with other creators</li>
        <li>🎯 Participate in tournaments and community events</li>
        <li>💬 Connect with fellow streamers and content creators</li>
      </ul>
      <p>If you didn't create this account, please ignore this email.</p>
      <div class="footer">
        <p>Best regards,<br>The Shuffle & Sync Team</p>
        <p><small>If the button doesn't work, copy and paste this link into your browser:<br>${verificationUrl}</small></p>
      </div>
    </div>
  </div>
</body>
</html>
    `
  };

  return await sendEmail(emailParams);
}

/**
 * Send email verification reminder (for users who haven't verified after some time)
 */
export async function sendEmailVerificationReminder(
  email: string,
  verificationToken: string,
  baseUrl: string,
  userName?: string
): Promise<boolean> {
  const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
  const displayName = userName || 'there';
  
  const emailParams: EmailParams = {
    to: email,
    from: 'noreply@shuffleandsync.com',
    subject: 'Reminder: Verify Your Email - Shuffle & Sync',
    text: `
Hello ${displayName},

This is a friendly reminder to verify your email address for your Shuffle & Sync account.

Click the link below to verify your email:
${verificationUrl}

This link will expire in 24 hours.

If you're having trouble or didn't create this account, please contact our support team.

Best regards,
The Shuffle & Sync Team
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Email Verification Reminder</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #ffc107; color: #212529; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; font-weight: bold; }
    .button:hover { background: #e0a800; }
    .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
    .reminder { background: #d4edda; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎮 Shuffle & Sync</h1>
      <p style="margin: 0; font-size: 18px;">Trading Card Game Community</p>
    </div>
    <div class="content">
      <h2>👋 Hey ${displayName}!</h2>
      <div class="reminder">
        <strong>🔔 Friendly Reminder:</strong> Your email address is still waiting to be verified.
      </div>
      <p>We're excited to have you join our trading card game community! To unlock all features and start connecting with fellow streamers, please verify your email address:</p>
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email Now</a>
      </div>
      <p>Once verified, you'll gain full access to our platform features and the TCG streaming community.</p>
      <p>If you're having trouble or need assistance, feel free to reach out to our support team.</p>
      <div class="footer">
        <p>Best regards,<br>The Shuffle & Sync Team</p>
        <p><small>If the button doesn't work, copy and paste this link into your browser:<br>${verificationUrl}</small></p>
      </div>
    </div>
  </div>
</body>
</html>
    `
  };

  return await sendEmail(emailParams);
}