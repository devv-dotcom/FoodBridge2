const express = require('express');
const controller = require('../controllers/profileController');
const { authenticate } = require('../middleware/auth');
const { uploadProfileImage } = require('../middleware/upload');

const router = express.Router();

router.get('/', authenticate, controller.getProfile);
router.put('/', authenticate, controller.updateProfile);
router.post('/image', authenticate, uploadProfileImage, controller.uploadProfileImage);

module.exports = router;
