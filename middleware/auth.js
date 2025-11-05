// Middleware kiểm tra đã login hay chưa
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        return next();
    } else {
        return res.redirect('/users/login');
    }
}

// Middleware kiểm tra quyền admin
function requireAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'admin') {
        return next();
    } else {
        return res.status(403).send('Access denied. Admin role required.');
    }
}

module.exports = {
    requireAuth,
    requireAdmin
};