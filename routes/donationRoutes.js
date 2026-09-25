const express = require('express');
const controller = require('../controllers/donationController');
const smartMatchController = require('../controllers/smartMatchController');
const { authenticate, authorizeBusiness, authorizeRoles } = require('../middleware/auth');
const { uploadFoodImages } = require('../middleware/upload');
const { donationValidation } = require('../middleware/validation');

const router = express.Router();

router.get('/emergency', controller.getEmergencyDonations);
router.post('/emergency-broadcast/:id', authenticate, controller.emergencyBroadcast);
router.get('/smart-match/:id', smartMatchController.getSmartMatch);
router.get('/available', controller.getAllDonations);
router.get('/search', controller.searchDonation);
router.get('/filter', controller.filterDonation);
router.get('/', controller.getAllDonations);
router.get('/:id', controller.getDonation);

router.post('/', authenticate, authorizeBusiness, uploadFoodImages, donationValidation, controller.createDonation);
router.put('/:id', authenticate, authorizeBusiness, uploadFoodImages, donationValidation, controller.updateDonation);
router.delete('/:id', authenticate, authorizeBusiness, controller.deleteDonation);

module.exports = router;
