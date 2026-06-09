const hanyaAdmin = (req, res, next) => {
    if (req.session && req.session.role === 'admin') {
        return next();
    }
    res.status(403).json({ success: false, message: 'Akses Ditolak! Khusus Admin.' });
};

module.exports = { hanyaAdmin };
