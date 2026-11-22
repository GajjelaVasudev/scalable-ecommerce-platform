
const express = require('express');

const {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    updateProfile,
    getUsers,
    updateUserRole,
    forgotPassword,
    resetPassword
} = require('../controllers/auth.controller');

const {
    loginLimiter,
    registerLimiter
} = require('../middlewares/rateLimit.middleware');
const authMiddleware = require('../middlewares/auth.middleware');
const authorize = require('../middlewares/authorize.middleware');

const router = express.Router();

router.post('/register', registerLimiter, registerUser);
router.post('/login', loginLimiter, loginUser);
router.post('/logout', logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Profile management
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);

// Admin user governance
router.get('/users', authMiddleware, authorize('admin'), getUsers);
router.patch('/users/:id/role', authMiddleware, authorize('admin'), updateUserRole);

module.exports = router;
