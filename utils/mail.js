const nodemailer = require('nodemailer');

const usingBrevo = Boolean(process.env.BREVO_API_KEY);

// Brevo validates its own verified sender.  Prefer MAIL_FROM when using its
// HTTPS API; the Gmail restriction only applies to the SMTP fallback.
const fromAddress = usingBrevo
  ? (process.env.MAIL_FROM || process.env.MAIL_USER)
  : (process.env.MAIL_HOST?.toLowerCase() === 'smtp.gmail.com' && process.env.MAIL_USER
    ? `Food Rescue <${process.env.MAIL_USER}>`
    : (process.env.MAIL_FROM || process.env.MAIL_USER));

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  secure: process.env.MAIL_SECURE === 'true',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD }
});

const senderValue = String(fromAddress || '').trim();
const senderMatch = senderValue.match(/^(.*?)\s*<([^>]+)>$/);
const looseEmailMatch = senderValue.match(/([\w.+-]+@[\w.-]+\.[A-Za-z]{2,})/);
const brevoSender = senderMatch
  ? { name: senderMatch[1].trim(), email: senderMatch[2].trim() }
  : looseEmailMatch
    ? { name: senderValue.replace(looseEmailMatch[1], '').trim(), email: looseEmailMatch[1] }
    : { email: senderValue };

async function deliver(message) {
  if (!usingBrevo) {
    if (process.env.NODE_ENV !== 'production') return transporter.sendMail(message);
    const error = new Error('BREVO_API_KEY is not configured; the SMTP fallback may be unavailable on this host.');
    error.code = 'BREVO_API_KEY_MISSING';
    throw error;
  }

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      sender: brevoSender,
      to: [{ email: message.to }],
      subject: message.subject,
      textContent: message.text,
      htmlContent: message.html
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    const error = new Error(`Brevo email request failed (${response.status}): ${detail}`);
    error.code = `BREVO_HTTP_${response.status}`;
    error.statusCode = response.status;
    throw error;
  }
}

async function sendPasswordOtp({ email, fullName, otp }) {
  await deliver({
    from: fromAddress,
    to: email,
    subject: 'Your Food Rescue password reset code',
    text: `Hello ${fullName}, your Food Rescue password reset code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Hello ${fullName},</p><p>Your Food Rescue password reset code is:</p><h1 style="letter-spacing:6px">${otp}</h1><p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>`
  });
}

async function sendLoginOtp({ email, fullName, otp }) {
  await deliver({
    from: fromAddress,
    to: email,
    subject: 'Your Food Rescue sign-in code',
    text: `Hello ${fullName}, your Food Rescue sign-in code is ${otp}. It expires in 10 minutes. If you did not try to sign in, you can ignore this email.`,
    html: `<p>Hello ${fullName},</p><p>Your Food Rescue sign-in code is:</p><h1 style="letter-spacing:6px">${otp}</h1><p>This code expires in 10 minutes. If you did not try to sign in, you can ignore this email.</p>`
  });
}

module.exports = { sendPasswordOtp, sendLoginOtp };
