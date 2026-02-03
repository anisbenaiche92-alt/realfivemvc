const bcrypt = require('bcrypt');
const db = require('../config/db');
const { sendEmail } = require('../config/mailer'); // Note le chemin ../config

// --- INSCRIPTION ---
exports.register = async (req, res) => {
    const { email, password, first_name, last_name, phone } = req.body;
    try {
        const [exists] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (exists.length > 0) return res.status(400).json({ error: "Email déjà utilisé" });

        const hash = await bcrypt.hash(password, 10);
        const friendCode = '#RF-' + Math.floor(1000 + Math.random() * 9000);
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        await db.query(
            `INSERT INTO users (email, password_hash, first_name, last_name, phone, role, friend_code, verification_code, is_verified) VALUES (?, ?, ?, ?, ?, 'JOUEUR', ?, ?, 0)`, 
            [email, hash, first_name, last_name, phone, friendCode, code]
        );

        await sendEmail(email, "Validation Compte", "BIENVENUE CHEZ REALFIVE", "Code de validation :", null, null, code);
        res.json({ step: "VERIFY_EMAIL", email: email, message: "Code envoyé par email" });
    } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
};

// --- VALIDATION COMPTE ---
exports.verifyAccount = async (req, res) => {
    const { email, code } = req.body;
    try {
        const [users] = await db.query('SELECT id FROM users WHERE email = ? AND verification_code = ?', [email, code]);
        if (users.length === 0) return res.status(400).json({ error: "Code invalide" });
        await db.query('UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?', [users[0].id]);
        res.json({ success: true, message: "Compte validé ! Connectez-vous." });
    } catch (e) { res.status(500).json({ error: "Erreur validation" }); }
};

// --- LOGIN (ÉTAPE 1) ---
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(401).json({ error: "Utilisateur inconnu" });
        
        const user = users[0];
        if (user.ban_expires_at && new Date(user.ban_expires_at) > new Date()) {
            return res.status(403).json({ error: "Compte suspendu." });
        }
        if (!user.is_verified) return res.status(403).json({ error: "Compte non validé." });

        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ error: "Mot de passe incorrect" });

        const code2FA = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = new Date(Date.now() + 10 * 60000); 

        await db.query('UPDATE users SET two_factor_code = ?, two_factor_expires = ? WHERE id = ?', [code2FA, expires, user.id]);
        await sendEmail(email, "Code de Sécurité", "CONNEXION AU DASHBOARD", "Votre code :", null, null, code2FA);

        res.json({ step: "2FA_REQUIRED", email: email, message: "Code envoyé" });
    } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
};

// --- LOGIN (ÉTAPE 2 - 2FA) ---
exports.login2FA = async (req, res) => {
    const { email, code } = req.body;
    try {
        const [users] = await db.query('SELECT * FROM users WHERE email = ? AND two_factor_code = ? AND two_factor_expires > NOW()', [email, code]);
        if (users.length === 0) return res.status(401).json({ error: "Code invalide ou expiré" });
        
        const user = users[0];
        await db.query('UPDATE users SET two_factor_code = NULL WHERE id = ?', [user.id]);

        req.session.user = { id: user.id, role: user.role, firstName: user.first_name, lastName: user.last_name, friendCode: user.friend_code };
        req.session.save((err) => {
            if (err) return res.status(500).json({ error: "Erreur session" });
            res.json({ message: "OK", redirect: (user.role === 'ADMIN' || user.role === 'PRO') ? '/dashboard-pro.html' : '/dashboard-joueur.html' });
        });
    } catch (e) { res.status(500).json({ error: "Erreur serveur" }); }
};

// --- MOT DE PASSE OUBLIÉ ---
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const token = require('crypto').randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000);
        const [u] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (u.length > 0) {
            await db.query('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?', [token, expires, u[0].id]);
            const link = `http://localhost:3000/reset-password.html?token=${token}`; 
            await sendEmail(email, "Réinitialisation", "MOT DE PASSE OUBLIÉ ?", "Cliquez ci-dessous :", link, "RÉINITIALISER");
        }
        res.json({ message: "Si l'email existe, un lien a été envoyé." });
    } catch(e) { res.status(500).json({ error: "Erreur" }); }
};

exports.resetPasswordConfirm = async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const [users] = await db.query('SELECT id FROM users WHERE reset_token = ? AND reset_expires > NOW()', [token]);
        if (users.length === 0) return res.status(400).json({ error: "Lien invalide" });
        const hash = await bcrypt.hash(newPassword, 10);
        await db.query('UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?', [hash, users[0].id]);
        res.json({ success: true, message: "Mot de passe modifié !" });
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
};

// --- SESSION & PROFIL ---
exports.logout = (req, res) => { req.session.destroy(); res.json({ redirect: '/login.html' }); };

exports.getMe = (req, res) => res.json({ loggedIn: !!req.session.user, user: req.session.user });

exports.getProfile = async (req, res) => {
    if (req.session.user) {
        const [r] = await db.query(`
            SELECT id, first_name, last_name, email, phone, bio, position, 
                   jersey_number, avatar_url, friend_code, notify_email 
            FROM users WHERE id=?
        `, [req.session.user.id]);
        res.json(r[0] || {});
    } else {
        res.status(401).json({});
    }
};

exports.updateProfile = async (req, res) => {
    if (!req.session.user) return res.status(401).json({});
    let sql = `UPDATE users SET first_name=?, last_name=?, phone=?, bio=?, position=?, jersey_number=?, notify_email=?`;
    let p = [req.body.first_name, req.body.last_name, req.body.phone, req.body.bio, req.body.position, req.body.jersey_number, req.body.notify_email === 'true'];
    
    if (req.file) {
        sql += `, avatar_url=?`;
        p.push('/uploads/' + req.file.filename);
    }
    sql += ` WHERE id=?`;
    p.push(req.session.user.id);
    
    try {
        await db.query(sql, p);
        req.session.user.firstName = req.body.first_name;
        req.session.user.lastName = req.body.last_name;
        res.json({ message: "OK" });
    } catch (e) { res.status(500).json({}); }
};