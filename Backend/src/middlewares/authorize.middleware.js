function authorize(...roles) {
    const allowedRoles = roles.flat();

    return (req, res, next) => {
        if (!req.user || !req.user.role || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        next();
    };
}

module.exports = authorize;