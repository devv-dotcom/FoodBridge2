const express = require('express');
const controller = require('../controllers/impactController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/public', controller.getPublicImpact);
router.get('/', authenticate, controller.getImpact);
router.get('/monthly', authenticate, controller.getMonthlyImpact);

module.exports = router;
