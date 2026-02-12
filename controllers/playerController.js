const db = require('../config/db');

// --- AMIS ---
exports.getFriends = async (req, res) => {
    try {
        // CORRECTION : On retire u.overall_rating qui n'existe pas en base
        // On met '6.0' as overall_rating pour simuler une note si le front en a besoin
        const [rows] = await db.query(`
    SELECT 
        u.id, 
        u.first_name, 
        u.last_name, 
        u.avatar_url, 
        u.position,
        -- Cette ligne calcule la vraie moyenne ou met 5.0 si aucun match n'est joué
        IFNULL((SELECT ROUND(AVG(rating), 1) FROM match_participants WHERE user_id = u.id), 5.0) as overall_rating
    FROM friends f 
    JOIN users u ON f.friend_id = u.id 
    WHERE f.user_id = ?`, 
    [req.session.user.id]
);
        res.json(rows);
    } catch (e) { 
        console.error("Erreur getFriends:", e); // Ajout du log pour voir l'erreur console
        res.json([]); 
    }
};

exports.addFriend = async (req, res) => {
    const { friendId } = req.body;
    try {
        const [exists] = await db.query('SELECT * FROM friends WHERE user_id = ? AND friend_id = ?', [req.session.user.id, friendId]);
        if(exists.length > 0) return res.json({ message: "Déjà ami" });
        await db.query('INSERT INTO friends (user_id, friend_id, status) VALUES (?, ?, "ACCEPTED"), (?, ?, "ACCEPTED")', [req.session.user.id, friendId, friendId, req.session.user.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({}); }
};

exports.addFriendByCode = async (req, res) => {
    const { code } = req.body;
    const myId = req.session.user.id;

    try {
        // 1. Trouver l'utilisateur cible
        const [users] = await db.query('SELECT id, first_name FROM users WHERE friend_code = ?', [code]);
        if(!users.length) return res.status(404).json({ error: "Code joueur introuvable." });
        
        const targetId = users[0].id;
        if(targetId === myId) return res.status(400).json({ error: "Tu ne peux pas t'ajouter toi-même." });

        // 2. Vérifier si DÉJÀ amis (Table friends)
        const [existingFriend] = await db.query('SELECT id FROM friends WHERE user_id = ? AND friend_id = ?', [myId, targetId]);
        if(existingFriend.length > 0) return res.status(400).json({ error: "Vous êtes déjà amis !" });

        // 3. Vérifier si demande DÉJÀ en cours (Table friend_requests)
        // On vérifie dans les deux sens : si je lui ai demandé OU s'il m'a demandé
        const [existingReq] = await db.query(`
            SELECT id, status FROM friend_requests 
            WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)`, 
            [myId, targetId, targetId, myId]
        );

        if(existingReq.length > 0) {
            const r = existingReq[0];
            if(r.status === 'PENDING') return res.status(400).json({ error: "Une demande est déjà en attente." });
            if(r.status === 'ACCEPTED') return res.status(400).json({ error: "Vous êtes déjà amis." });
        }

        // 4. CRÉER LA DEMANDE (Insert dans friend_requests)
        await db.query('INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, "PENDING")', [myId, targetId]);
        
        // 5. Créer la notification
        await db.query('INSERT INTO notifications (user_id, type, message, sender_id, notification_type, action_url, action_label) VALUES (?, ?, ?, ?, ?, ?, ?)', 
            [targetId, 'FRIEND_REQUEST', `${req.session.user.firstName} veut t'ajouter en ami.`, myId, 'INVITATION', '/friends.html', 'Voir']
        );

        res.json({ success: true, message: "Demande envoyée avec succès !" });

    } catch(e) { 
        console.error(e);
        // L'erreur 1062 correspond au duplicate entry si la requête SQL précédente a échoué la vérification
        if(e.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: "Demande déjà envoyée." });
        res.status(500).json({ error: "Erreur serveur." }); 
    }
};

exports.removeFriend = async (req, res) => {
    try {
        await db.query('DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)', [req.session.user.id, req.body.friendId, req.body.friendId, req.session.user.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({}); }
};

exports.searchPlayers = async (req, res) => {
    const q = '%' + req.query.q + '%';
    try {
        const [users] = await db.query(`SELECT id, first_name, last_name, avatar_url, friend_code FROM users WHERE (first_name LIKE ? OR last_name LIKE ? OR friend_code LIKE ?) AND id != ? AND role != 'ADMIN' LIMIT 5`, [q, q, q, req.session.user.id]);
        res.json(users);
    } catch (e) { res.json([]); }
};

// --- DEMANDES D'AMIS ---
exports.sendFriendRequest = async (req, res) => {
    try {
        await db.query('INSERT INTO friend_requests (sender_id, receiver_id, status) VALUES (?, ?, "PENDING")', [req.session.user.id, req.body.friendId]);
        await db.query('INSERT INTO notifications (user_id, type, message, sender_id, notification_type, action_url, action_label) VALUES (?, ?, ?, ?, ?, ?, ?)', [req.body.friendId, 'FRIEND_REQUEST', `${req.session.user.firstName} vous a envoyé une demande d'ami`, req.session.user.id, 'INVITATION', '/friends.html', 'Voir']);
        res.json({ success: true });
    } catch(e) { res.status(500).json({}); }
};

exports.respondFriendRequest = async (req, res) => {
    const { requestId, action } = req.body; // action = 'ACCEPT' ou 'DECLINE'
    
    try {
        // 1. Récupérer la demande
        const [reqs] = await db.query('SELECT * FROM friend_requests WHERE id = ?', [requestId]);
        if(!reqs.length) return res.status(404).json({ error: "Demande introuvable" });
        
        const { sender_id, receiver_id } = reqs[0];

        // Vérifier que c'est bien moi qui réponds à la demande
        if(receiver_id !== req.session.user.id) return res.status(403).json({ error: "Non autorisé" });

        if (action === 'ACCEPT') {
            // A. Mettre à jour le statut de la demande
            await db.query('UPDATE friend_requests SET status = "ACCEPTED" WHERE id = ?', [requestId]);

            // B. CRÉER L'AMITIÉ DANS LES DEUX SENS
            // Grâce à IGNORE, si ça existe déjà (doublon), ça ne plante pas
            await db.query(`INSERT IGNORE INTO friends (user_id, friend_id, status) VALUES (?, ?, 'ACCEPTED'), (?, ?, 'ACCEPTED')`, 
                [sender_id, receiver_id, receiver_id, sender_id]
            );

            // C. Notifier l'autre
            await db.query('INSERT INTO notifications (user_id, type, message) VALUES (?, "FRIEND_ACCEPTED", "Demande d\'ami acceptée !")', [sender_id]);

        } else {
            // Si refusé, on supprime la demande ou on la passe en DECLINED
            await db.query('DELETE FROM friend_requests WHERE id = ?', [requestId]);
        }

        res.json({ success: true });
    } catch(e) { 
        console.error(e);
        res.status(500).json({ error: "Erreur lors de la réponse." }); 
    }
};

exports.getFriendRequests = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT fr.*, u.first_name, u.last_name, u.avatar_url FROM friend_requests fr JOIN users u ON fr.sender_id = u.id WHERE fr.receiver_id = ? AND fr.status = "PENDING"', [req.session.user.id]);
        res.json(rows);
    } catch(e) { res.json([]); }
};

// --- STATS DÉTAILLÉES (RADAR) ---
exports.getPlayerStats = async (req, res) => {
    const userId = req.session.user.id;
    try {
        const [rows] = await db.query(`
            SELECT m.score_home, m.score_away, r.start_time, mp.team_side, mp.goals, mp.rating
            FROM match_participants mp
            JOIN matches m ON mp.match_id = m.id
            JOIN reservations r ON m.reservation_id = r.id
            WHERE mp.user_id = ? AND r.status != 'CANCELLED'
            ORDER BY r.start_time DESC
        `, [userId]);

        let wins=0, totalGoals=0, totalRating=0;
        let history = [];

        rows.forEach(row => {
            let result = 'NUL';
            const myScore = row.team_side === 'A' ? row.score_home : row.score_away;
            const oppScore = row.team_side === 'A' ? row.score_away : row.score_home;
            if(myScore > oppScore) { result = 'VICTOIRE'; wins++; }
            else if(myScore < oppScore) result = 'DÉFAITE';
            
            totalGoals += (row.goals || 0);
            totalRating += parseFloat(row.rating || 5.0);
            history.push({ date: row.start_time, result, score: `${row.score_home}-${row.score_away}`, myRating: row.rating || 5.0 });
        });

        const totalMatches = rows.length;
        const avgRating = totalMatches > 0 ? (totalRating / totalMatches).toFixed(1) : "5.0";
        const winRate = totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
        const base = parseFloat(avgRating) * 10;

        // Structure EXACTE que ton frontend attend
        res.json({
            totalMatches, winRate, totalGoals, avgRating, history,
            stats: {
                atk: Math.min(99, Math.floor(base + (totalGoals * 2))),
                def: Math.min(99, Math.floor(base - totalGoals)),
                phy: Math.min(99, Math.floor(base + Math.random()*10)),
                pac: Math.min(99, Math.floor(base + Math.random()*10)),
                tec: Math.min(99, Math.floor(base + 5)),
                pas: Math.min(99, Math.floor(base + 2))
            }
        });
    } catch (e) { res.status(500).json({}); }
};

exports.getUserStats = async (req, res) => {
    const targetId = req.params.id;
    try {
        const [user] = await db.query('SELECT first_name, last_name, position, jersey_number, avatar_url FROM users WHERE id = ?', [targetId]);
        if(!user.length) return res.status(404).json({});
        
        const [rows] = await db.query(`SELECT mp.rating, mp.goals FROM match_participants mp JOIN matches m ON mp.match_id = m.id JOIN reservations r ON m.reservation_id = r.id WHERE mp.user_id = ? AND r.status != 'CANCELLED'`, [targetId]);
        
        let totalGoals=0, totalRating=0;
        rows.forEach(r => { totalGoals += r.goals||0; totalRating += parseFloat(r.rating||5.0); });
        const avgRating = rows.length > 0 ? (totalRating/rows.length).toFixed(1) : "5.0";
        const base = parseFloat(avgRating) * 10;

        res.json({
            info: user[0],
            stats: {
                matches: rows.length, goals: totalGoals, rating: avgRating,
                radar: {
                    atk: Math.min(99, Math.floor(base + totalGoals*2)),
                    def: Math.min(99, Math.floor(base - totalGoals)),
                    phy: Math.min(99, Math.floor(base + Math.random()*10)),
                    pac: Math.min(99, Math.floor(base + Math.random()*10)),
                    tec: Math.min(99, Math.floor(base + 5)),
                    pas: Math.min(99, Math.floor(base + 2))
                }
            }
        });
    } catch(e) { res.status(500).json({}); }
};

exports.searchPlayers = async (req, res) => {
    const q = '%' + req.query.q + '%';
    try {
        const [users] = await db.query(`
            SELECT id, first_name, last_name, avatar_url, friend_code 
            FROM users 
            WHERE (first_name LIKE ? OR last_name LIKE ? OR friend_code LIKE ?) 
              AND id != ? 
              AND role != 'ADMIN' 
            LIMIT 5
        `, [q, q, q, req.session.user.id]);
        res.json(users);
    } catch (e) { 
        res.json([]); 
    }
};


// DANS VOTRE CONTROLLER CÔTÉ SERVEUR (ex: controllers/paymentController.js)

// DANS controllers/playerController.js

exports.verifyPromo = async (req, res) => {
    // 1. On récupère TOUTES les infos envoyées par le JS
    const { code, amount, terrain_id, start_time, duration } = req.body;

    try {
        // 2. On cherche le code promo
        const [rows] = await db.query('SELECT * FROM promo_codes WHERE code = ?', [code]);
        if (rows.length === 0) return res.status(404).json({ valid: false, error: "Code inconnu" });
        const promo = rows[0];

        // 3. Vérifications de validité
        const now = new Date();

        // --- NOUVEAU : Vérification de la date de début ---
        if (promo.starts_at && now < new Date(promo.starts_at)) {
            return res.status(400).json({ 
                valid: false, 
                error: "Ce code n'est pas encore utilisable." 
            });
        }

        // Vérification de l'expiration
        if (now > new Date(promo.expires_at)) {
            return res.status(400).json({ valid: false, error: "Code expiré" });
        }

        // Vérification du nombre d'utilisations
        if (promo.current_uses >= promo.max_uses) {
            return res.status(400).json({ valid: false, error: "Code épuisé" });
        }

        // 4. CALCUL DU PRIX
        let newPrice = parseFloat(amount);
        let label = "";

        if (promo.discount_type === 'PERCENT') {
            newPrice = amount - (amount * (promo.value / 100));
            label = `-${promo.value}%`;
        } 
        else if (promo.discount_type === 'FIXED') {
            newPrice = Math.max(0, amount - promo.value);
            label = `-${promo.value}€`;
        } 
        else if (promo.discount_type === 'HOURLY_FIXED') {
            const ratePerPlayer = parseFloat(promo.value); 
            
            let durationH = parseFloat(duration);
            if (durationH > 5) {
                durationH = durationH / 60;
            }

            if (parseFloat(amount) < 30) {
                newPrice = ratePerPlayer * durationH;
                label = `Tarif Découverte (${ratePerPlayer}€/pers)`;
            } else {
                const totalPlayers = 10; 
                newPrice = ratePerPlayer * totalPlayers * durationH;
                label = `Tarif Découverte (${ratePerPlayer * totalPlayers}€/terrain)`;
            }
        }

        res.json({
            valid: true,
            newPrice: newPrice.toFixed(2),
            label: label,
            promoType: promo.discount_type
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ valid: false, error: "Erreur serveur" });
    }
};
