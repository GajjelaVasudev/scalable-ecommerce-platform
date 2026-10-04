const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth.middleware');
const authorize = require('../middleware/role.middleware');

const {
    confirmReservations,
    releaseReservations
} = require('../controllers/reservation.controller');

router.patch('/:orderId/confirm', authMiddleware, authorize('admin'), confirmReservations);

router.patch('/:orderId/release', authMiddleware, authorize('admin'), releaseReservations);

module.exports = router;