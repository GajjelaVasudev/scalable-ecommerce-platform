const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

module.exports = { registerUser, loginUser, logoutUser };