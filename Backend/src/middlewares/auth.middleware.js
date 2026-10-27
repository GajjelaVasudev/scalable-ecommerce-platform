const jwt = require('jsonwebtoken');
const userModel = require('../models/user.model');

async function authMiddleware(req, res, next) {
    let token = req.cookies?.token;

    if (!token && req.headers?.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
            token = parts[1];
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = {
            id: decoded.id,
            role: decoded.role
        };
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

module.exports = authMiddleware;