const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Please enter a valid email"]
    },
    password: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;