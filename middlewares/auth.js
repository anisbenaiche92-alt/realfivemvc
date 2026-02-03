// middlewares/auth.js
exports.isAuthenticated = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Non connecté" });
    }
    next();
};

exports.isAuthorized = (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ error: "Non connecté" });
    }
    if (req.session.user.role !== 'PRO' && req.session.user.role !== 'ADMIN') {
        return res.status(403).json({ error: "Accès refusé" });
    }
    next();
};

exports.isAdmin = (req, res, next) => {
    if (!req.session || !req.session.user || req.session.user.role !== 'ADMIN') {
        return res.status(403).json({ error: "Admin uniquement" });
    }
    next();
};