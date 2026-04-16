const nodemailer = require('nodemailer');
require('dotenv').config();

// Create reusable transporter object
// Create reusable transporter object
// Use Port 587 (STARTTLS) which is more reliable in cloud environments
const transporterConfig = {
const smtpPort = (process.env.SMTP_PORT || '587').toString().trim();
const isSecure = smtpPort === '465';

const transporterConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(smtpPort),
  secure: isSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS?.toString().trim(),
  },
  tls: {
    rejectUnauthorized: false
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000
};

const transporter = nodemailer.createTransport(transporterConfig);

/**
 * Send Verification Email with a premium HTML template
 * @param {string} email - Student email
 * @param {string} token - Verification token
 * @param {string} name - Student name
 */
const sendVerificationEmail = async (email, token, name) => {
  const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${token}`;

  const mailOptions = {
    from: `"CHCCI Portal Registrar" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Confirm Your Student Identity - CHCCI Portal Gateway',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Inter', system-ui, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 50px -10px rgba(0,0,0,0.1); }
          .header { background-color: #002147; padding: 40px; text-align: center; }
          .logo { color: #ffffff; font-size: 24px; font-weight: 900; letter-spacing: 2px; }
          .content { padding: 40px; }
          h1 { color: #002147; font-size: 24px; font-weight: 900; margin-bottom: 24px; }
          p { color: #475569; font-size: 16px; line-height: 1.6; margin-bottom: 32px; }
          .button-container { text-align: center; margin: 40px 0; }
          .button { 
            background-color: #D4AF37; 
            color: #002147 !important; 
            padding: 18px 36px; 
            border-radius: 16px; 
            text-decoration: none; 
            font-weight: 900; 
            font-size: 14px; 
            text-transform: uppercase; 
            letter-spacing: 1px;
            display: inline-block;
            box-shadow: 0 10px 20px -5px rgba(212, 175, 55, 0.4);
          }
          .footer { background-color: #f8fafc; padding: 24px; text-align: center; border-top: 1px solid #e2e8f0; }
          .footer p { font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin: 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">CHCCI ACADEMC HUB</div>
          </div>
          <div class="content">
            <h1>Welcome to the Digital Campus, ${name}!</h1>
            <p>
              Your student portal account has been successfully generated. To finalize your secure connection and gain access to your individual academic dashboard, please confirm your email address below.
            </p>
            <div class="button-container">
              <a href="${verificationLink}" class="button">Secure Identity Now</a>
            </div>
            <p style="font-size: 13px; color: #64748b;">
              If the button above doesn't work, please copy and paste this link into your browser: <br>
              <span style="color: #002147; font-weight: 700;">${verificationLink}</span>
            </p>
          </div>
          <div class="footer">
            <p>Concepcion Holy Cross College Inc. • Secure Gateway 2026</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Real Email Sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Mailer Error Type:', error.code || 'UNKNOWN');
    console.error('❌ Mailer Error Message:', error.message);
    if (error.stack) console.error('❌ Mailer Stack Trace:', error.stack);
    return false;
  }
};

module.exports = { sendVerificationEmail };
