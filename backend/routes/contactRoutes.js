const express = require('express');
const controller = require('../controllers/contactController');
const { contactValidation } = require('../middleware/validation');
const { rateLimit } = require('../middleware/rateLimit');

const router = express.Router();
router.post('/', rateLimit({ max: 5, message: 'Too many contact messages from this address. Please try again later.' }), contactValidation, controller.createMessage);
module.exports = router;
