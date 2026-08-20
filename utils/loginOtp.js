const crypto = require('crypto');
const User = require('../models/User');
const { sendLoginOtp } = require('./mail');

const hashOtp = otp => crypto.createHash('sha256').update(otp).digest('hex');

const beginLoginOtp = async user => {
  const otp = crypto.randomInt(100000, 1000000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await User.saveLoginOtp(user.email, hashOtp(otp), expiresAt);
  await sendLoginOtp({ email: user.email, fullName: user.full_name, otp });
  return { success: true, otpRequired: true, email: user.email, message: 'We sent a 6-digit sign-in code to your email. It expires in 10 minutes.' };
};

module.exports = { beginLoginOtp, hashOtp };
