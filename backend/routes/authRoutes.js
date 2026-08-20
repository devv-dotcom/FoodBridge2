const express = require('express');
const controller = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { registerValidation, loginValidation, emailValidation, otpValidation, resetPasswordValidation } = require('../middleware/validation');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/register', registerValidation, controller.register);
router.post('/login', rateLimit(), loginValidation, controller.login);
router.post('/logout', authenticate, controller.logout);
router.post('/forgot-password', emailValidation, controller.forgotPassword);
router.post('/verify-otp', otpValidation, controller.verifyOtp);
router.post('/reset-password', resetPasswordValidation, controller.resetPassword);
router.get('/profile', authenticate, controller.profile);

module.exports = router;
