const express = require('express');
const router = express.Router();
const {createOrder} = require('../controllers/order.controller');
const authenticate = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

router.post('/create', authenticate, authorize(['buyer']), createOrder);

module.exports = router;    