const nodemailer = require('nodemailer');

// Gmail only permits sending as the authenticated account or a verified
// "Send mail as" alias. Use the authenticated account to avoid OTP delivery
// failures when MAIL_FROM is configured with an unverified address.
const fromAddress = process.env.MAIL_HOST?.toLowerCase() === 'smtp.gmail.com' && process.env.MAIL_USER
  ? `Food Rescue <${process.env.MAIL_USER}>`
  : (process.env.MAIL_FROM || process.env.MAIL_USER);

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  secure: process.env.MAIL_SECURE === 'true',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD }
});

async function sendPasswordOtp({ email, fullName, otp }) {
  await transporter.sendMail({
    from: fromAddress,
    to: email,
    subject: 'Your Food Rescue password reset code',
    text: `Hello ${fullName}, your Food Rescue password reset code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Hello ${fullName},</p><p>Your Food Rescue password reset code is:</p><h1 style="letter-spacing:6px">${otp}</h1><p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>`
  });
}

async function sendLoginOtp({ email, fullName, otp }) {
  await transporter.sendMail({
    from: fromAddress,
    to: email,
    subject: 'Your Food Rescue sign-in code',
    text: `Hello ${fullName}, your Food Rescue sign-in code is ${otp}. It expires in 10 minutes. If you did not try to sign in, you can ignore this email.`,
    html: `<p>Hello ${fullName},</p><p>Your Food Rescue sign-in code is:</p><h1 style="letter-spacing:6px">${otp}</h1><p>This code expires in 10 minutes. If you did not try to sign in, you can ignore this email.</p>`
  });
}

module.exports = { sendPasswordOtp, sendLoginOtp };
