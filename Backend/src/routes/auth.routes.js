
const express = require('express');

const {
    registerUser,
    loginUser,
    logoutUser
} = require('../controllers/auth.controller');

const {
    loginLimiter,
    registerLimiter
} = require('../middlewares/rateLimit.middleware');

const router = express.Router();

router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/logout', logoutUser);

module.exports = router;
