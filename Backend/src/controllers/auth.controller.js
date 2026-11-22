const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const storageService = require('../services/storage.service');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizePhone(phone) {
    if (!phone || typeof phone !== 'string') return null;
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10 && /^[6-9]\d{9}$/.test(digits)) {
        return `+91 ${digits}`;
    }
    if (digits.length === 12 && /^91[6-9]\d{9}$/.test(digits)) {
        return `+91 ${digits.slice(2)}`;
    }
    return null;
}

function validateAndParseDob(dob, dobParts) {
    if (!dob && !dobParts) return { isValid: true, date: null };

    let d = null;
    if (dobParts && typeof dobParts === 'object') {
        const day = parseInt(dobParts.dobDay || dobParts.day, 10);
        const month = parseInt(dobParts.dobMonth || dobParts.month, 10);
        const year = parseInt(dobParts.dobYear || dobParts.year, 10);
        if (day && month && year) {
            d = new Date(Date.UTC(year, month - 1, day));
            if (d.getUTCFullYear() !== year || d.getUTCMonth() !== month - 1 || d.getUTCDate() !== day) {
                return { isValid: false, error: 'Please enter a valid calendar date' };
            }
        }
    } else if (dob) {
        if (dob instanceof Date) {
            d = dob;
        } else if (typeof dob === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dob.trim())) {
            const [y, m, day] = dob.trim().split('-').map(n => parseInt(n, 10));
            d = new Date(Date.UTC(y, m - 1, day));
            if (d.getUTCFullYear() !== y || d.getUTCMonth() !== m - 1 || d.getUTCDate() !== day) {
                return { isValid: false, error: 'Please enter a valid calendar date' };
            }
        } else if (typeof dob === 'string' || typeof dob === 'number') {
            d = new Date(dob);
        }
    }

    if (!d || isNaN(d.getTime())) {
        return { isValid: false, error: 'Invalid date of birth format' };
    }

    const now = new Date();
    const minDate = new Date('1900-01-01');
    if (d > now) {
        return { isValid: false, error: 'Date of birth cannot be in the future' };
    }
    if (d < minDate) {
        return { isValid: false, error: 'Date of birth must be after January 1, 1900' };
    }

    return { isValid: true, date: d };
}

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
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        displayName: user.displayName || (user.firstName ? `${user.firstName} ${(user.lastName || '').charAt(0)}.`.trim() : ''),
        phone: user.phone || null,
        altPhone: user.altPhone || null,
        avatarUrl: user.avatarUrl || null,
        gender: user.gender || 'prefer-not-to-say',
        dateOfBirth: user.dateOfBirth ? user.dateOfBirth.toISOString().split('T')[0] : null,
        commLang: user.commLang || 'en',
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

async function getProfile(req, res) {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        const sanitized = sanitizeUser(user);
        return res.status(200).json({
            message: 'Profile fetched successfully',
            user: sanitized,
            profile: sanitized
        });
    } catch (error) {
        console.error('getProfile error:', error.message);
        return res.status(500).json({ message: 'Failed to fetch user profile' });
    }
}

async function updateProfile(req, res) {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const {
            username,
            email,
            currentPassword,
            newPassword,
            firstName,
            lastName,
            displayName,
            phone,
            altPhone,
            avatarUrl,
            gender,
            dateOfBirth,
            dobDay,
            dobMonth,
            dobYear,
            commLang
        } = req.body;

        // 1. Password change (requires current password validation)
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

        // 2. Username change
        if (username && username.trim().toLowerCase() !== user.username) {
            const trimmed = username.trim().toLowerCase();
            if (trimmed.length < 3) {
                return res.status(400).json({ message: 'Username must be at least 3 characters long' });
            }
            const existing = await User.findOne({ username: trimmed });
            if (existing) {
                return res.status(400).json({ message: 'Username is already taken' });
            }
            user.username = trimmed;
        }

        // 3. Email change (restricted without email verification - Phase 6 integrity)
        if (email && email.trim().toLowerCase() !== user.email) {
            return res.status(400).json({
                message: 'Email address cannot be changed directly without verification. Re-verification service is deferred to the next milestone.'
            });
        }

        // 4. Extended Profile Fields (whitelisted)
        if (firstName !== undefined) {
            if (typeof firstName !== 'string') {
                return res.status(400).json({ message: 'First name must be a string' });
            }
            if (firstName.trim().length > 100) {
                return res.status(400).json({ message: 'First name cannot exceed 100 characters' });
            }
            user.firstName = firstName.trim();
        }

        if (lastName !== undefined) {
            if (typeof lastName !== 'string') {
                return res.status(400).json({ message: 'Last name must be a string' });
            }
            if (lastName.trim().length > 100) {
                return res.status(400).json({ message: 'Last name cannot exceed 100 characters' });
            }
            user.lastName = lastName.trim();
        }

        if (displayName !== undefined) {
            if (typeof displayName !== 'string') {
                return res.status(400).json({ message: 'Display name must be a string' });
            }
            if (displayName.trim().length > 100) {
                return res.status(400).json({ message: 'Display name cannot exceed 100 characters' });
            }
            user.displayName = displayName.trim();
        }

        if (phone !== undefined) {
            if (phone === null || phone === '') {
                user.phone = null;
            } else {
                const sanitizedPhone = sanitizePhone(phone);
                if (!sanitizedPhone) {
                    return res.status(400).json({ message: 'Valid 10-digit Indian mobile number is required (starting with 6-9)' });
                }
                user.phone = sanitizedPhone;
            }
        }

        if (altPhone !== undefined) {
            if (altPhone === null || altPhone === '') {
                user.altPhone = null;
            } else {
                const sanitizedAltPhone = sanitizePhone(altPhone);
                if (!sanitizedAltPhone) {
                    return res.status(400).json({ message: 'Alternate phone must be a valid 10-digit Indian mobile number (starting with 6-9)' });
                }
                user.altPhone = sanitizedAltPhone;
            }
        }

        if (avatarUrl !== undefined) {
            if (avatarUrl === null || avatarUrl === '') {
                user.avatarUrl = null;
            } else if (typeof avatarUrl === 'string') {
                const trimmedUrl = avatarUrl.trim();
                if (trimmedUrl.length > 500) {
                    return res.status(400).json({ message: 'Avatar URL cannot exceed 500 characters' });
                }
                if (!trimmedUrl.startsWith('/uploads/avatars/') && !/^https?:\/\//i.test(trimmedUrl)) {
                    return res.status(400).json({ message: 'Avatar URL must be a valid server upload path or URL' });
                }
                user.avatarUrl = trimmedUrl;
            } else {
                return res.status(400).json({ message: 'Avatar URL must be a string' });
            }
        }

        if (gender !== undefined) {
            const allowedGenders = ['female', 'male', 'non-binary', 'prefer-not-to-say'];
            const g = typeof gender === 'string' ? gender.trim().toLowerCase() : '';
            if (!allowedGenders.includes(g)) {
                return res.status(400).json({ message: `Gender must be one of: ${allowedGenders.join(', ')}` });
            }
            user.gender = g;
        }

        if (dateOfBirth !== undefined || (dobDay && dobMonth && dobYear)) {
            const dobParts = dobDay ? { dobDay, dobMonth, dobYear } : null;
            const dobResult = validateAndParseDob(dateOfBirth, dobParts);
            if (!dobResult.isValid) {
                return res.status(400).json({ message: dobResult.error });
            }
            user.dateOfBirth = dobResult.date;
        }

        if (commLang !== undefined) {
            const allowedLangs = ['en', 'hi', 'kn', 'ta', 'mr'];
            const l = typeof commLang === 'string' ? commLang.trim().toLowerCase() : '';
            if (!allowedLangs.includes(l)) {
                return res.status(400).json({ message: `Communication language must be one of: ${allowedLangs.join(', ')}` });
            }
            user.commLang = l;
        }

        // Auto-generate sensible displayName fallback if missing
        if (!user.displayName && user.firstName) {
            user.displayName = `${user.firstName} ${(user.lastName || '').charAt(0)}.`.trim();
        }

        await user.save();

        const sanitized = sanitizeUser(user);
        return res.status(200).json({
            message: 'Profile updated successfully',
            user: sanitized,
            profile: sanitized
        });
    } catch (error) {
        console.error('updateProfile error:', error.message);
        return res.status(500).json({ message: 'Failed to update profile' });
    }
}

async function uploadAvatar(req, res) {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const image = req.body.image || req.body.imageData;
        const mimeType = req.body.mimeType;
        if (!image || typeof image !== 'string') {
            return res.status(400).json({ message: 'Valid image data (base64 or DataURL) is required' });
        }

        let buffer;
        let detectedMime = mimeType;

        if (image.startsWith('data:')) {
            const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
            if (!matches) {
                return res.status(400).json({ message: 'Invalid DataURL image format' });
            }
            detectedMime = matches[1];
            buffer = Buffer.from(matches[2], 'base64');
        } else {
            buffer = Buffer.from(image, 'base64');
        }

        const oldAvatarUrl = user.avatarUrl;
        const newAvatarUrl = await storageService.saveAvatar(user._id, buffer, detectedMime);

        user.avatarUrl = newAvatarUrl;
        try {
            await user.save();
        } catch (dbError) {
            // Roll back newly created file on database save failure
            await storageService.deleteAvatar(newAvatarUrl);
            throw dbError;
        }

        // Only delete the previous avatar once DB update is confirmed
        if (oldAvatarUrl && oldAvatarUrl !== newAvatarUrl) {
            await storageService.deleteAvatar(oldAvatarUrl);
        }

        return res.status(200).json({
            message: 'Avatar uploaded successfully',
            avatarUrl: user.avatarUrl,
            user: sanitizeUser(user)
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        if (statusCode >= 500) {
            console.error('uploadAvatar error:', error.message);
        }
        return res.status(statusCode).json({ message: error.message || 'Failed to upload avatar' });
    }
}

async function removeAvatar(req, res) {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'User not authenticated' });
        }
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.avatarUrl) {
            await storageService.deleteAvatar(user.avatarUrl);
            user.avatarUrl = null;
            await user.save();
        }

        return res.status(200).json({
            message: 'Avatar removed successfully',
            user: sanitizeUser(user)
        });
    } catch (error) {
        console.error('removeAvatar error:', error.message);
        return res.status(500).json({ message: 'Failed to remove avatar' });
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
    getProfile,
    updateProfile,
    uploadAvatar,
    removeAvatar,
    getUsers,
    updateUserRole,
    forgotPassword,
    resetPassword,
    sanitizePhone,
    validateAndParseDob,
    sanitizeUser
};