const bcrypt = require('bcrypt');
const db = require('../config/db');
const { sendEmail } = require('../config/mailer');

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

// --- LOGIN ---
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

// --- SESSION & PROFIL (CORRECTION ICI) ---
exports.logout = (req, res) => { req.session.destroy(); res.json({ redirect: '/login.html' }); };

exports.getMe = (req, res) => res.json({ loggedIn: !!req.session.user, user: req.session.user });

// ✅ C'EST CETTE FONCTION QUI CORRIGE L'AFFICHAGE VIDE DU PROFIL
exports.getProfile = async (req, res) => {
    // 1. Vérification de sécurité
    if (!req.session.user) {
        return res.status(401).json({ error: "Non connecté" });
    }

    try {
        // 2. Requête sécurisée
        const [r] = await db.query(`
            SELECT id, first_name, last_name, email, phone, bio, 
                   position, jersey_number, avatar_url, friend_code, notify_email 
            FROM users 
            WHERE id = ?`, 
            [req.session.user.id]
        );

        // 3. Vérification si l'utilisateur existe
        if (r.length > 0) {
            res.json(r[0]);
        } else {
            res.status(404).json({ error: "Utilisateur introuvable" });
        }
    } catch (e) {
        console.error("Erreur getProfile:", e); // Affiche l'erreur dans la console serveur
        res.status(500).json({ error: "Erreur serveur" });
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


// Ajouter ces fonctions dans authController.js

exports.getUnreadNotifications = async (req, res) => {
    if (!req.session.user) return res.json([]);
    try {
        const [rows] = await db.query('SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 10', [req.session.user.id]);
        res.json(rows);
    } catch(e) { res.json([]); }
};

exports.getMyComplex = async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'PRO') return res.status(403).json({});
    try {
        const [rows] = await db.query('SELECT * FROM complexes WHERE owner_id = ?', [req.session.user.id]);
        res.json(rows[0] || {});
    } catch(e) { res.status(500).json({}); }
};

exports.uploadImages = async (req, res) => {
    if (!req.session.user || (req.session.user.role !== 'PRO' && req.session.user.role !== 'ADMIN')) {
        return res.status(403).json({ error: "Accès refusé" });
    }
    
    try {
        const urls = req.files.map(f => '/uploads/' + f.filename);
        const [complex] = await db.query('SELECT id, gallery FROM complexes WHERE owner_id = ?', [req.session.user.id]);
        
        if (!complex.length) return res.status(404).json({ error: "Complexe introuvable. Créez-le d'abord !" });

        let currentGallery = complex[0].gallery ? JSON.parse(complex[0].gallery) : [];
        const newGallery = [...currentGallery, ...urls];
        
        await db.query('UPDATE complexes SET gallery = ? WHERE id = ?', [JSON.stringify(newGallery), complex[0].id]);
        res.json({ success: true, urls: newGallery });
    } catch (e) { console.error(e); res.status(500).json({ error: "Erreur upload" }); }
};

exports.getPlayerStats = async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "Non connecté" });
    const userId = req.session.user.id;

    try {
        const [rows] = await db.query(`
            SELECT 
                m.score_home, m.score_away, r.start_time,
                mp.team_side, mp.goals, mp.assists, mp.rating
            FROM match_participants mp
            JOIN matches m ON mp.match_id = m.id
            JOIN reservations r ON m.reservation_id = r.id
            WHERE mp.user_id = ? AND r.status != 'CANCELLED'
            ORDER BY r.start_time DESC
        `, [userId]);

        let wins = 0, draws = 0, losses = 0;
        let totalGoals = 0;
        let totalRating = 0;
        let history = [];

        rows.forEach(row => {
            let result = 'NUL';
            const myScore = row.team_side === 'A' ? row.score_home : row.score_away;
            const oppScore = row.team_side === 'A' ? row.score_away : row.score_home;
            
            let statusLabel = 'À VENIR';
            if (row.score_home !== 0 || row.score_away !== 0) {
                if (myScore > oppScore) { result = 'VICTOIRE'; wins++; }
                else if (myScore < oppScore) { result = 'DÉFAITE'; losses++; }
                else { result = 'NUL'; draws++; }
                statusLabel = result;
            }

            totalGoals += (row.goals || 0);
            totalRating += parseFloat(row.rating || 6.0);

            history.push({
                date: row.start_time,
                result: statusLabel,
                score: `${row.score_home} - ${row.score_away}`,
                myRating: row.rating || 6.0
            });
        });

        const totalMatches = rows.length;
        const avgRating = totalMatches > 0 ? (totalRating / totalMatches).toFixed(1) : "6.0";
        const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;

        const base = parseFloat(avgRating) * 10; 
        const stats = {
            atk: Math.min(99, Math.floor(base + (totalGoals * 2))),
            def: Math.min(99, Math.floor(base - (totalGoals))),
            phy: Math.min(99, Math.floor(base + Math.random() * 10)),
            pac: Math.min(99, Math.floor(base + Math.random() * 10)),
            tec: Math.min(99, Math.floor(base + 5)),
            pas: Math.min(99, Math.floor(base + 2))
        };

        res.json({
            totalMatches,
            winRate,
            totalGoals,
            avgRating,
            history,
            stats
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

exports.getUserStats = async (req, res) => {
    if (!req.session.user) return res.status(401).json({ error: "Non connecté" });
    const targetId = req.params.id;

    try {
        const [user] = await db.query('SELECT first_name, last_name, position, jersey_number, avatar_url FROM users WHERE id = ?', [targetId]);
        if(!user.length) return res.status(404).json({error: "Joueur introuvable"});

        const [rows] = await db.query(`
            SELECT mp.rating, mp.goals
            FROM match_participants mp
            JOIN matches m ON mp.match_id = m.id
            JOIN reservations r ON m.reservation_id = r.id
            WHERE mp.user_id = ? AND r.status != 'CANCELLED'
        `, [targetId]);

        let totalGoals = 0;
        let totalRating = 0;

        rows.forEach(r => {
            totalGoals += (r.goals || 0);
            totalRating += parseFloat(r.rating || 6.0);
        });

        const totalMatches = rows.length;
        const avgRating = totalMatches > 0 ? (totalRating / totalMatches).toFixed(1) : "6.0";

        const base = parseFloat(avgRating) * 10;
        const stats = {
            atk: Math.min(99, Math.floor(base + (totalGoals * 2))),
            def: Math.min(99, Math.floor(base - (totalGoals))), 
            phy: Math.min(99, Math.floor(base + Math.random() * 10)),
            pac: Math.min(99, Math.floor(base + Math.random() * 10)),
            tec: Math.min(99, Math.floor(base + 5)),
            pas: Math.min(99, Math.floor(base + 2))
        };

        res.json({
            info: user[0],
            stats: {
                matches: totalMatches,
                goals: totalGoals,
                rating: avgRating,
                radar: stats
            }
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erreur serveur" });
    }
};
