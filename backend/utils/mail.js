const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 587),
  secure: process.env.MAIL_SECURE === 'true',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD }
});

async function sendPasswordOtp({ email, fullName, otp }) {
  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: email,
    subject: 'Your FoodBridge password reset code',
    text: `Hello ${fullName}, your FoodBridge password reset code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Hello ${fullName},</p><p>Your FoodBridge password reset code is:</p><h1 style="letter-spacing:6px">${otp}</h1><p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>`
  });
}

module.exports = { sendPasswordOtp };
