const mongoose = require('mongoose');

async function connectDB(uri = process.env.MONGODB_URI) {
    if (!uri) {
        throw new Error('MONGODB_URI is not defined in environment variables');
    }
    await mongoose.connect(uri);
    console.log('MongoDB connected successfully');
}

async function closeDB() {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log('MongoDB disconnected gracefully');
    }
}

module.exports = connectDB;
module.exports.connectDB = connectDB;
module.exports.closeDB = closeDB;