const express = require('express');
const controller = require('../controllers/businessController');
const { authenticate, authorizeBusiness, requireActiveAccount } = require('../middleware/auth');
const { uploadLogo, uploadCover } = require('../middleware/upload');
const { businessProfileValidation, changePasswordValidation } = require('../middleware/validation');

const router = express.Router();

router.use(authenticate, authorizeBusiness, requireActiveAccount);
router.get('/dashboard', controller.getDashboard);
router.get('/profile', controller.getProfile);
router.put('/profile', businessProfileValidation, controller.updateProfile);
router.post('/logo', uploadLogo, controller.uploadLogo);
router.post('/cover', uploadCover, controller.uploadCover);
router.put('/change-password', changePasswordValidation, controller.changePassword);

module.exports = router;
