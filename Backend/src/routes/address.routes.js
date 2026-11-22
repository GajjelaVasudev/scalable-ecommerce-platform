const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const addressController = require('../controllers/address.controller');

// All address routes require customer authentication
router.use(authMiddleware);

router.get('/', addressController.getAddresses);
router.post('/', addressController.createAddress);
router.post('/sync', addressController.syncAddresses);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);
router.patch('/:id/default', addressController.setDefaultAddress);

module.exports = router;
