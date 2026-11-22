const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getCookieOptions() {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    };
}

function sanitizeUser(user) {
    return {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
}

async function registerUser(req, res) {
    try {
        const { username, email, password, role } = req.body;

        if (
            typeof username !== 'string' ||
            !username.trim() ||
            typeof email !== 'string' ||
            !email.trim() ||
            typeof password !== 'string' ||
            !password
        ) {
            return res.status(400).json({
                message: 'Username, valid email, and password are required'
            });
        }

        const trimmedUsername = username.trim().toLowerCase();
        const trimmedEmail = email.trim().toLowerCase();

        if (trimmedUsername.length < 3) {
            return res.status(400).json({
                message: 'Username must be at least 3 characters long'
            });
        }

        if (!EMAIL_REGEX.test(trimmedEmail)) {
            return res.status(400).json({
                message: 'Please enter a valid email address'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must be at least 6 characters long'
            });
        }

        // Prevent public registration from assigning privileged roles.
        if (role && role !== 'buyer') {
            return res.status(403).json({
                message: 'Assigning privileged roles during public registration is not permitted'
            });
        }

        const existingUser = await User.findOne({
            $or: [{ username: trimmedUsername }, { email: trimmedEmail }]
        });

        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username: trimmedUsername,
            email: trimmedEmail,
            password: hashedPassword,
            role: 'buyer'
        });

        await user.save();

        return res.status(201).json({
            message: 'Registration successful.',
            user: sanitizeUser(user)
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'User already exists' });
        }
        console.error('Registration error:', error.message);
        return res.status(500).json({ message: 'Internal server error during registration' });
    }
}

async function loginUser(req, res) {
    try {
        const { username, email, password } = req.body;

        if (
            (!username && !email) ||
            (username && typeof username !== 'string') ||
            (email && typeof email !== 'string') ||
            typeof password !== 'string' ||
            !password
        ) {
            return res.status(400).json({
                message: 'Valid identifier (username or email) and password are required'
            });
        }

        const query = {};
        if (email) {
            query.email = email.trim().toLowerCase();
        } else if (username) {
            query.username = username.trim().toLowerCase();
        }

        const user = await User.findOne(query);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not configured');
            return res.status(500).json({ message: 'Server authentication configuration error' });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, getCookieOptions());

        return res.status(200).json({
            message: 'Login successful.',
            token,
            user: sanitizeUser(user)
        });
    } catch (error) {
        console.error('Login error:', error.message);
        return res.status(500).json({ message: 'Internal server error during login' });
    }
}

async function logoutUser(req, res) {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    });

    return res.status(200).json({
        message: 'User logged out successfully'
    });
}

async function getMe(req, res) {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({
            user: sanitizeUser(user)
        });
    } catch (error) {
        console.error('getMe error:', error.message);
        return res.status(500).json({ message: 'Failed to fetch user profile' });
    }
}

async function updateProfile(req, res) {
    try {
        const { username, email, currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Current password is required to set a new password' });
            }
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect' });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ message: 'New password must be at least 6 characters long' });
            }
            user.password = await bcrypt.hash(newPassword, 10);
        }

        if (username && username.trim().toLowerCase() !== user.username) {
            const trimmed = username.trim().toLowerCase();
            const existing = await User.findOne({ username: trimmed });
            if (existing) {
                return res.status(400).json({ message: 'Username is already taken' });
            }
            user.username = trimmed;
        }

        if (email && email.trim().toLowerCase() !== user.email) {
            const trimmed = email.trim().toLowerCase();
            if (!EMAIL_REGEX.test(trimmed)) {
                return res.status(400).json({ message: 'Invalid email address' });
            }
            const existing = await User.findOne({ email: trimmed });
            if (existing) {
                return res.status(400).json({ message: 'Email is already in use' });
            }
            user.email = trimmed;
        }

        await user.save();

        return res.status(200).json({
            message: 'Profile updated successfully',
            user: sanitizeUser(user)
        });
    } catch (error) {
        console.error('updateProfile error:', error.message);
        return res.status(500).json({ message: 'Failed to update profile' });
    }
}

async function getUsers(req, res) {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
        const skip = (page - 1) * limit;
        const role = req.query.role;
        const filter = {};

        if (role && ['buyer', 'seller', 'admin'].includes(role)) {
            filter.role = role;
        }

        if (req.query.search && typeof req.query.search === 'string' && req.query.search.trim()) {
            const s = req.query.search.trim();
            filter.$or = [
                { username: { $regex: s, $options: 'i' } },
                { email: { $regex: s, $options: 'i' } }
            ];
        }

        const [users, total] = await Promise.all([
            User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            User.countDocuments(filter)
        ]);

        return res.status(200).json({
            message: 'Users fetched successfully',
            users: users.map(sanitizeUser),
            pagination: {
                page,
                limit,
                totalUsers: total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('getUsers error:', error.message);
        return res.status(500).json({ message: 'Failed to fetch users' });
    }
}

async function updateUserRole(req, res) {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['buyer', 'seller', 'admin'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be buyer, seller, or admin' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.role = role;
        await user.save();

        return res.status(200).json({
            message: `User role updated to ${role} successfully`,
            user: sanitizeUser(user)
        });
    } catch (error) {
        console.error('updateUserRole error:', error.message);
        return res.status(500).json({ message: 'Failed to update user role' });
    }
}

async function forgotPassword(req, res) {
    try {
        const { email } = req.body;

        if (typeof email !== 'string' || !email.trim()) {
            return res.status(400).json({ message: 'Valid email address is required' });
        }

        const trimmedEmail = email.trim().toLowerCase();
        const user = await User.findOne({ email: trimmedEmail });

        if (!user) {
            return res.status(200).json({
                message: 'If that email address exists in our system, a password reset link has been dispatched.'
            });
        }

        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        const responsePayload = {
            message: 'If that email address exists in our system, a password reset link has been dispatched.'
        };

        if (process.env.NODE_ENV !== 'production') {
            responsePayload.resetToken = rawToken;
        }

        return res.status(200).json(responsePayload);
    } catch (error) {
        console.error('forgotPassword error:', error.message);
        return res.status(500).json({ message: 'Internal server error during password reset request' });
    }
}

async function resetPassword(req, res) {
    try {
        const { resetToken, newPassword } = req.body;

        if (typeof resetToken !== 'string' || !resetToken.trim() || typeof newPassword !== 'string' || !newPassword) {
            return res.status(400).json({ message: 'Reset token and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: 'New password must be at least 6 characters long' });
        }

        const hashedToken = crypto.createHash('sha256').update(resetToken.trim()).digest('hex');

        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!user) {
            return res.status(400).json({ message: 'Password reset token is invalid or has expired' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        return res.status(200).json({
            message: 'Password has been reset successfully. You may now sign in with your new credentials.'
        });
    } catch (error) {
        console.error('resetPassword error:', error.message);
        return res.status(500).json({ message: 'Internal server error during password reset' });
    }
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getMe,
    updateProfile,
    getUsers,
    updateUserRole,
    forgotPassword,
    resetPassword
};