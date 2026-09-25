const mongoose = require('mongoose');

async function connectDB() {
    const mongoUri = process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
}

module.exports = connectDB;