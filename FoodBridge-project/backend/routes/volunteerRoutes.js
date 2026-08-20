const express = require('express');
const controller = require('../controllers/volunteerController');
const { authenticate, authorizeRoles, requireActiveAccount } = require('../middleware/auth');
const { uploadVolunteerProfile } = require('../middleware/upload');
const { volunteerRegistrationValidation, volunteerProfileValidation, loginValidation, changePasswordValidation, availabilityValidation } = require('../middleware/validation');

const router = express.Router();
router.post('/register', volunteerRegistrationValidation, controller.registerVolunteer);
router.post('/login', loginValidation, controller.loginVolunteer);
router.use(authenticate, authorizeRoles('volunteer'), requireActiveAccount);
router.post('/logout', controller.logoutVolunteer);
router.get('/profile', controller.getProfile);
router.put('/profile', volunteerProfileValidation, controller.updateProfile);
router.post('/profile/photo', uploadVolunteerProfile, controller.uploadProfilePhoto);
router.put('/change-password', changePasswordValidation, controller.changePassword);
router.put('/status', availabilityValidation, controller.updateAvailability);
router.get('/pickups', controller.getAssignedPickups);
router.get('/history', controller.pickupHistory);
module.exports = router;
