const express = require('express');
const controller = require('../controllers/donationController');
const { authenticate, authorizeBusiness } = require('../middleware/auth');
const { uploadFoodImages } = require('../middleware/upload');
const { donationValidation } = require('../middleware/validation');

const router = express.Router();

router.get('/search', controller.searchDonation);
router.get('/filter', controller.filterDonation);
router.get('/', controller.getAllDonations);
router.get('/:id', controller.getDonation);
router.post('/', authenticate, authorizeBusiness, uploadFoodImages, donationValidation, controller.createDonation);
router.put('/:id', authenticate, authorizeBusiness, uploadFoodImages, donationValidation, controller.updateDonation);
router.delete('/:id', authenticate, authorizeBusiness, controller.deleteDonation);

module.exports = router;
