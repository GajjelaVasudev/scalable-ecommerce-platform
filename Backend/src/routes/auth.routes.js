
const express = require('express');

const {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    getProfile,
    updateProfile,
    uploadAvatar,
    removeAvatar,
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
router.get('/profile', authMiddleware, getProfile);
router.put('/profile', authMiddleware, updateProfile);
router.post('/profile/avatar', authMiddleware, uploadAvatar);
router.delete('/profile/avatar', authMiddleware, removeAvatar);

// Admin user governance
router.get('/users', authMiddleware, authorize('admin'), getUsers);
router.patch('/users/:id/role', authMiddleware, authorize('admin'), updateUserRole);

module.exports = router;
