const express = require('express');
const controller = require('../controllers/categoryController');
const { authenticate, authorizeRoles } = require('../middleware/auth');
const { requireActiveAdmin } = require('../middleware/adminAuth');
const { categoryCreateValidation, categoryUpdateValidation } = require('../middleware/validation');

const router = express.Router();
router.get('/', controller.list);
router.use(authenticate, authorizeRoles('admin'), requireActiveAdmin);
router.post('/', categoryCreateValidation, controller.create);
router.put('/:id', categoryUpdateValidation, controller.update);
router.delete('/:id', controller.remove);
module.exports = router;
