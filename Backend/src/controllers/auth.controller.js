const User = require('../models/user.model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

async function registerUser(req, res) {
    const { username, email, password, role } = req.body;
    const existinguser = await User.findOne({ $or: [{ username }, { email }] });
    if (existinguser) {
        return res.status(400).json({ message: "User already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword, role });
    await user.save();
    return res.status(201).json({
        message: 'Registration successful.',
        user
    });
}

async function loginUser(req, res) {
    const { username, email, password } = req.body;
    const user = await User.findOne({ $or: [{ username }, { email }] });
    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: "Invalid password" });
    }
    
    const token = jwt.sign({id: user._id, role: user.role},process.env.JWT_SECRET);
    res.cookie('token',token);

    return res.status(200).json({
        message: 'Login successful.',
        user
    });
}

async function logoutUser(req, res) {

    res.clearCookie('token');

    return res.status(200).json({
        message: 'User logged out successfully'
    });
}

module.exports = { registerUser, loginUser , logoutUser };