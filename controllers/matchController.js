const db = require('../config/db');
const { sendEmail } = require('../config/mailer');

// --- 1. RECHERCHE & MERCATO ---
exports.lookupMatch = async (req, res) => {
    const code = req.params.code;
    try {
        const [match] = await db.query("SELECT id FROM matches WHERE match_code = ?", [code]);
        if (match.length) res.json({ found: true, matchId: match[0].id });
        else res.json({ found: false });
    } catch (e) { res.status(500).json({ error: "Erreur serveur" }); }
};

exports.getMercato = async (req, res) => {
    try {
        // CORRECTION : 
        // 1. On compte les vrais participants (players_count) au lieu de regarder slots_paid
        // 2. On affiche le match tant qu'il n'est pas FINI (end_time > NOW) au lieu de masqué dès le début
        const [rows] = await db.query(`
            SELECT 
                m.id as match_id, 
                m.match_code, 
                r.start_time, 
                r.total_price, 
                r.payment_mode,
                (SELECT COUNT(*) FROM match_participants mp WHERE mp.match_id = m.id) as current_players,
                t.name as pitch_name, 
                u.first_name as captain_name, 
                u.avatar_url as captain_avatar, 
                t.sport_type
            FROM matches m
            JOIN reservations r ON m.reservation_id = r.id
            JOIN terrains t ON r.terrain_id = t.id
            JOIN users u ON r.user_id = u.id
            WHERE r.is_public = 1 
            AND r.status != 'CANCELLED' 
            AND r.end_time > NOW()
            HAVING current_players < 10
            ORDER BY r.start_time ASC
        `);
        res.json(rows);
    } catch (e) { 
        console.error("Erreur Mercato:", e);
        res.json([]); 
    }
};
// --- 2. CRÉATION & PAIEMENT COMPLET (VERSION FINALE) ---
exports.createAndPay = async (req, res) => {
    const { terrainId, date, time, duration, slotsToPay, phone } = req.body;
    const userId = req.session.user.id;

    try {
        // 1. Mise à jour du téléphone dans la table users
        if (phone) {
            await db.query('UPDATE users SET phone = ? WHERE id = ?', [phone, userId]);
        }

        const start = `${date} ${time}:00`;
        const dur = parseInt(duration) || 1;
        const end = new Date(new Date(start).getTime() + (dur * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ');

        // 2. Vérification des créneaux
        const [conflicts] = await db.query(
            `SELECT id FROM reservations WHERE terrain_id = ? AND status != 'CANCELLED' AND ((start_time < ? AND end_time > ?))`, 
            [terrainId, end, start]
        );
        if (conflicts.length > 0) return res.json({ success: false, error: "Créneau indisponible" });

        const [terrain] = await db.query('SELECT hourly_rate FROM terrains WHERE id = ?', [terrainId]);
        const basePrice = terrain[0].hourly_rate * dur;
        const finalSlotsPaid = parseInt(slotsToPay) || 1;

        // 3. Insertion de la réservation
        const [resRes] = await db.query(
            `INSERT INTO reservations (user_id, terrain_id, start_time, end_time, total_price, status, payment_status, slots_paid) 
             VALUES (?, ?, ?, ?, ?, 'CONFIRMED', 'PAID', ?)`,
            [userId, terrainId, start, end, basePrice, finalSlotsPaid]
        );
        
        // 4. GÉNÉRATION DU MATCH (Sans creator_id car la colonne n'existe pas dans ta BDD)
        const matchCode = 'M-' + Math.floor(100000 + Math.random() * 900000);
        const [resMatch] = await db.query(
            `INSERT INTO matches (reservation_id, status, match_code) VALUES (?, 'SCHEDULED', ?)`, 
            [resRes.insertId, matchCode]
        );
        const matchId = resMatch.insertId;

        // 5. Ajout du capitaine aux participants
        await db.query(
            `INSERT INTO match_participants (match_id, user_id, team_side, has_paid) VALUES (?, ?, 'A', 1)`, 
            [matchId, userId]
        );

        res.json({ success: true, matchId: matchId, code: matchCode });
    } catch (e) { 
        console.error("Crash createAndPay:", e); 
        res.status(500).json({ error: "Erreur lors de la création du match" }); 
    }
};

// --- 3. PAIEMENT & JOIN ---
exports.confirmPayment = async (req, res) => {
    const { matchId, method } = req.body; 
    try {
        const [match] = await db.query(`
            SELECT m.id, r.id as res_id, r.payment_mode, r.slots_paid, r.start_time, t.name as terrain_name 
            FROM matches m 
            JOIN reservations r ON m.reservation_id = r.id 
            JOIN terrains t ON r.terrain_id = t.id 
            WHERE m.id = ? AND r.status != 'CANCELLED' AND (r.expires_at IS NULL OR r.expires_at > NOW())
        `, [matchId]);
        if (!match.length) return res.json({ success: false, error: "Match introuvable" });

        await db.query(`INSERT INTO match_participants (match_id, user_id, team_side, has_paid) VALUES (?, ?, 'A', 1) ON DUPLICATE KEY UPDATE has_paid=1`, [matchId, req.session.user.id]);
        
        if (match[0].payment_mode === 'FULL') {
            await db.query("UPDATE reservations SET slots_paid = 10, status = 'CONFIRMED' WHERE id = ?", [match[0].res_id]);
        } else {
            await db.query(`UPDATE reservations SET slots_paid = slots_paid + 1, status = CASE WHEN slots_paid + 1 >= 1 THEN 'CONFIRMED' ELSE status END WHERE id = ?`, [match[0].res_id]);
        }

        const dateStr = new Date(match[0].start_time).toLocaleString('fr-FR');
        const matchLink = `http://localhost:3000/match.html?id=${matchId}`;
        const [u] = await db.query('SELECT email FROM users WHERE id = ?', [req.session.user.id]);
        if (u.length) {
            await sendEmail(u[0].email, "Confirmation Match", "PLACE CONFIRMÉE !", `Paiement validé (${method}).<br>Terrain: <b>${match[0].terrain_name}</b><br>Date: <b>${dateStr}</b>`, matchLink, "ACCÉDER AU LOBBY");
        }

        res.json({ success: true, matchId });
    } catch (e) { res.status(500).json({ error: "Erreur paiement" }); }
};

exports.getPaymentDetails = async (req, res) => {
    const { matchId } = req.query;
    try {
        // ✅ CORRECTIF : Ajout de la vérification d'expiration
        const [rows] = await db.query(`
            SELECT m.id, m.match_code, r.start_time, r.total_price, r.payment_mode, r.user_id as creator_id 
            FROM matches m 
            JOIN reservations r ON m.reservation_id = r.id 
            WHERE m.id = ? AND r.status != 'CANCELLED' AND (r.expires_at IS NULL OR r.expires_at > NOW())
        `, [matchId]);
        
        if (!rows.length) return res.status(400).json({ error: "Match introuvable ou expiré" });
        
        const match = rows[0];
        const [participant] = await db.query('SELECT has_paid FROM match_participants WHERE match_id = ? AND user_id = ?', [matchId, req.session.user.id]);
        
        let amount = 0;
        if (!participant.length || !participant[0].has_paid) {
            amount = match.payment_mode === 'FULL' ? (req.session.user.id === match.creator_id ? match.total_price : 0) : match.total_price / 10;
        }
        res.json({ match_code: match.match_code, start_time: match.start_time, amount_to_pay: amount });
    } catch(e) { 
        res.status(500).json({}); 
    }
};


exports.joinByCode = async (req, res) => {
    const { code } = req.body;
    try {
        const [m] = await db.query('SELECT id FROM matches WHERE match_code = ?', [code]);
        if(!m.length) return res.status(404).json({ error: "Code invalide" });
        await db.query(`INSERT INTO match_participants (match_id, user_id, team_side, has_paid) VALUES (?, ?, 'A', 0) ON DUPLICATE KEY UPDATE match_id=match_id`, [m[0].id, req.session.user.id]);
        res.json({ success: true, matchId: m[0].id });
    } catch(e) { res.status(500).json({}); }
};

exports.joinPay = async (req, res) => {
    const { matchId } = req.body;
    try {
        // ✅ CORRECTIF : Vérification complète du statut ET expiration
        const [matches] = await db.query(`
            SELECT m.id, r.id as res_id, r.slots_paid, r.status, r.expires_at 
            FROM matches m 
            JOIN reservations r ON m.reservation_id = r.id 
            WHERE m.id = ? AND r.status != 'CANCELLED' AND (r.expires_at IS NULL OR r.expires_at > NOW())
        `, [matchId]);
        
        if(!matches.length) return res.status(400).json({error: "Match introuvable ou expiré"});
        
        const match = matches[0];
        if(match.slots_paid >= 10) return res.status(400).json({error: "Match complet"});
        
        const [existing] = await db.query('SELECT * FROM match_participants WHERE match_id = ? AND user_id = ?', [matchId, req.session.user.id]);
        if(existing.length > 0) { 
            await db.query('UPDATE match_participants SET has_paid = 1 WHERE id = ?', [existing[0].id]); 
        } else { 
            await db.query('INSERT INTO match_participants (match_id, user_id, team_side, has_paid) VALUES (?, ?, "A", 1)', [matchId, req.session.user.id]); 
        }
        
        const newSlots = match.slots_paid + 1;
        let newStatus = match.status;
        if(newSlots >= 1 && match.status === 'PENDING_PAYMENT') newStatus = 'CONFIRMED'; 
        
        await db.query('UPDATE reservations SET slots_paid = ?, status = ? WHERE id = ?', [newSlots, newStatus, match.res_id]);
        res.json({ success: true, status: newStatus });
    } catch(e) { 
        console.error(e); 
        res.status(500).json({ error: "Erreur serveur" }); 
    }
};


exports.book = async (req, res) => {
    const { terrain_id, date, time_slot, price, duration, payment_mode } = req.body;
    try {
        const start = `${date} ${time_slot}:00`;
        const dur = duration || 1;
        const end = new Date(new Date(start).getTime() + (dur * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ');
        const expiresAt = null;
        
        const [conflicts] = await db.query(`SELECT id FROM reservations WHERE terrain_id = ? AND status != 'CANCELLED' AND ((start_time < ? AND end_time > ?))`, [terrain_id, end, start]);
        if (conflicts.length > 0) return res.status(400).json({ error: "Créneau pris" });

        const [resRes] = await db.query(`INSERT INTO reservations (user_id, terrain_id, start_time, end_time, total_price, status, payment_mode, slots_paid, expires_at) VALUES (?, ?, ?, ?, ?, 'PENDING_PAYMENT', ?, 0, ?)`, 
            [req.session.user.id, terrain_id, start, end, price, payment_mode || 'SPLIT', expiresAt]);
        
        const matchCode = 'M-' + Math.floor(1000 + Math.random() * 9000);
        const [resMatch] = await db.query(`INSERT INTO matches (reservation_id, status, match_code) VALUES (?, 'SCHEDULED', ?)`, [resRes.insertId, matchCode]);
        
        await db.query(`INSERT INTO match_participants (match_id, user_id, team_side, has_paid) VALUES (?, ?, 'A', 0)`, [resMatch.insertId, req.session.user.id]);
        
        res.json({ success: true, matchId: resMatch.insertId, code: matchCode });
    } catch (e) { console.error(e); res.status(500).json({ error: "Erreur serveur" }); }
};

// --- 4. LOBBY & AFFICHAGE (CORRIGÉ POUR ÉVITER LE "MATCH INTROUVABLE") ---
exports.getMatchDetails = async (req, res) => {
    try {
        // 1. Récupération des infos du match
        // Correction ici aussi : score_a/score_b -> score_home/score_away
        const [m] = await db.query(`
            SELECT m.id, m.match_code, m.status, m.score_home, m.score_away,m.team_name_a, m.team_name_b, 
            r.start_time, r.end_time, r.total_price, r.payment_mode, r.is_public, r.user_id as creator_id,
            r.slots_paid, r.status as res_status,
            t.name as terrain_name, c.name as complex_name, c.address, c.city
            FROM matches m
            JOIN reservations r ON m.reservation_id = r.id
            JOIN terrains t ON r.terrain_id = t.id
            JOIN complexes c ON t.complex_id = c.id
            WHERE m.id = ?`, 
            [req.params.id]);

        if (!m.length) return res.status(404).json({ error: "Match introuvable" });
        
        if (m[0].res_status === 'CANCELLED') {
            return res.status(410).json({ error: "Ce match a été annulé" });
        }

        // 2. Récupération des joueurs
        // CORRECTION MAJEURE ICI : 'u.overall_rating' n'existe pas, on utilise 'mp.rating'
        const [parts] = await db.query(`
            SELECT u.id, u.first_name, u.last_name, u.avatar_url, u.position, 
            mp.rating as overall_rating, 
            mp.team_side, mp.has_paid
            FROM match_participants mp
            JOIN users u ON mp.user_id = u.id
            WHERE mp.match_id = ?`, [req.params.id]);

        // 3. Identification des amis
        const [friends] = await db.query('SELECT friend_id FROM friends WHERE user_id = ?', [req.session.user.id]);
        const friendIds = friends.map(f => f.friend_id);
        const enrichedParts = parts.map(p => ({...p, isFriend: friendIds.includes(p.id)}));

        // 4. Vérification si l'utilisateur est dans le match
        const me = enrichedParts.find(p => p.id === req.session.user.id);
        if (!me && m[0].payment_mode === 'SPLIT' && m[0].slots_paid >= 10) {
            return res.status(403).json({ error: "Match complet" });
        }

        res.json({ match: m[0], players: enrichedParts, serverTime: new Date() });
    } catch (e) {
        console.error("Erreur getMatchDetails:", e);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// --- 5. DASHBOARD JOUEUR (CORRECTION AFFICHAGE) ---
// Dans matchController.js

exports.getMyMatches = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                r.id as reservation_id,
                r.start_time,
                r.end_time,
                r.total_price,
                r.status as res_status,
                r.payment_mode,
                r.slots_paid,
                t.name as pitch_name,
                m.id as match_id,
                m.match_code,
                m.status as match_status
            FROM reservations r
            JOIN matches m ON r.id = m.reservation_id
            JOIN terrains t ON r.terrain_id = t.id
            JOIN match_participants mp ON m.id = mp.match_id
            WHERE mp.user_id = ?
              AND r.status != 'CANCELLED'
            ORDER BY r.start_time DESC
        `, [req.session.user.id]);

        res.json(rows);
    } catch (e) {
        console.error("Erreur /api/reservations:", e);
        res.status(500).json([]);
    }
};


exports.checkAvailability = async (req, res) => {
    const { date, terrainId } = req.query;
    try {
        const [rows] = await db.query(`SELECT HOUR(start_time) as start_h, HOUR(end_time) as end_h FROM reservations WHERE terrain_id = ? AND DATE(start_time) = ? AND status != 'CANCELLED'`, [terrainId, date]);
        let busyHours = [];
        rows.forEach(r => {
            let end = r.end_h === 0 ? 24 : r.end_h;
            if (end <= r.start_h) end = r.start_h + 1;
            for (let h = r.start_h; h < end; h++) busyHours.push(h);
        });
        res.json(busyHours);
    } catch (e) { res.json([]); }
};

// --- AUTRES ACTIONS ---
exports.togglePublic = async (req, res) => {
    const { matchId } = req.body;
    console.log(`🔄 Toggle Public - Match ${matchId} par user ${req.session.user?.id}`);
    
    try {
        const [m] = await db.query('SELECT r.id, r.is_public, r.user_id FROM matches m JOIN reservations r ON m.reservation_id = r.id WHERE m.id = ?', [matchId]);
        
        if(!m.length) {
            console.log("❌ Match introuvable");
            return res.status(404).json({ error: "Match introuvable" });
        }
        
        if(m[0].user_id !== req.session.user.id) {
            console.log(`❌ User ${req.session.user.id} n'est pas le créateur (${m[0].user_id})`);
            return res.status(403).json({ error: "Seul le capitaine peut changer la visibilité" });
        }
        
        const currentState = m[0].is_public;
        const newState = currentState ? 0 : 1;
        
        console.log(`📝 Changement: ${currentState} → ${newState}`);
        
        // Mise à jour
        await db.query('UPDATE reservations SET is_public = ? WHERE id = ?', [newState, m[0].id]);
        
        // Vérification immédiate que ça a marché
        const [check] = await db.query('SELECT is_public FROM reservations WHERE id = ?', [m[0].id]);
        console.log(`✅ État après update: ${check[0].is_public}`);
        
        res.json({ 
            success: true, 
            is_public: newState === 1,
            message: newState === 1 ? "Match maintenant PUBLIC" : "Match maintenant PRIVÉ"
        });
        
    } catch(e) { 
        console.error("💥 Erreur togglePublic:", e);
        res.status(500).json({ error: "Erreur serveur" }); 
    }
};

exports.inviteFriendV2 = async (req, res) => {
    const { matchId, friendId } = req.body;
    try {
        const [match] = await db.query('SELECT r.*, m.match_code FROM matches m JOIN reservations r ON m.reservation_id = r.id WHERE m.id = ?', [matchId]);
        const isFree = match[0].payment_mode === 'FULL' && match[0].slots_paid >= 10;
        const msg = isFree ? `${req.session.user.firstName} vous offre une place pour le match ${match[0].match_code}` : `${req.session.user.firstName} vous invite au match ${match[0].match_code}`;
        
        await db.query('INSERT INTO match_invitations (match_id, sender_id, receiver_id, message) VALUES (?, ?, ?, ?)', [matchId, req.session.user.id, friendId, msg]);
        await db.query('INSERT INTO notifications (user_id, type, message, match_id, sender_id, notification_type, action_url, action_label) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
        [friendId, 'MATCH_INVITE_V2', msg, matchId, req.session.user.id, 'INVITATION', `/match.html?id=${matchId}`, isFree ? 'Accepter' : 'Voir']);
        res.json({ success: true });
    } catch(e) { res.status(500).json({}); }
};

exports.invitationRespond = async (req, res) => {
    const { invitationId, action } = req.body;
    try {
        const [inv] = await db.query('SELECT * FROM match_invitations WHERE id = ?', [invitationId]);
        if(!inv.length) return res.status(404).json({});
        await db.query('UPDATE match_invitations SET status = ? WHERE id = ?', [action, invitationId]);
        if(action === 'ACCEPTED') {
            await db.query(`INSERT INTO match_participants (match_id, user_id, team_side, has_paid) VALUES (?, ?, 'A', 0) ON DUPLICATE KEY UPDATE match_id=match_id`, [inv[0].match_id, req.session.user.id]);
        }
        res.json({ success: true });
    } catch(e) { res.status(500).json({}); }
};

exports.getPendingInvitations = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT mi.*, m.match_code, u.first_name as sender_name, u.avatar_url as sender_avatar 
            FROM match_invitations mi 
            JOIN matches m ON mi.match_id = m.id 
            JOIN users u ON mi.sender_id = u.id 
            WHERE mi.receiver_id = ? AND mi.status = 'PENDING'`, [req.session.user.id]);
        res.json(rows);
    } catch(e) { res.json([]); }
};

exports.changeSide = async (req, res) => {
    try {
        await db.query(`UPDATE match_participants SET team_side = ? WHERE match_id = ? AND user_id = ?`, [req.body.side, req.body.matchId, req.session.user.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({}); }
};

exports.leaveMatch = async (req, res) => {
    const { matchId } = req.body;
    try {
        const [m] = await db.query('SELECT r.user_id as creator_id, r.id as res_id, r.payment_mode, r.slots_paid FROM matches m JOIN reservations r ON m.reservation_id = r.id WHERE m.id = ?', [matchId]);
        if (!m.length) return res.status(404).json({ error: "Match introuvable" });

        if (m[0].creator_id === req.session.user.id) {
            await db.query("UPDATE reservations SET status = 'CANCELLED' WHERE id = ?", [m[0].res_id]);
            await db.query('DELETE FROM match_participants WHERE match_id = ?', [matchId]);
            const [others] = await db.query('SELECT user_id FROM match_participants WHERE match_id = ?', [matchId]);
            for (const o of others) {
                if(o.user_id !== req.session.user.id) await db.query('INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)', [o.user_id, 'MATCH_CANCELLED', "Match annulé par le capitaine"]);
            }
            res.json({ success: true, cancelled: true });
        } else {
            await db.query('DELETE FROM match_participants WHERE match_id = ? AND user_id = ?', [matchId, req.session.user.id]);
            if(m[0].payment_mode === 'SPLIT') {
                await db.query('UPDATE reservations SET slots_paid = GREATEST(0, slots_paid - 1) WHERE id = ?', [m[0].res_id]);
            }
            res.json({ success: true, cancelled: false });
        }
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
};

exports.kickPlayer = async (req, res) => {
    const { matchId, targetId } = req.body;
    try {
        const [m] = await db.query('SELECT r.user_id as creator_id FROM matches m JOIN reservations r ON m.reservation_id = r.id WHERE m.id = ?', [matchId]);
        if (!m.length || m[0].creator_id !== req.session.user.id) return res.status(403).json({ error: "Non autorisé" });

        await db.query('DELETE FROM match_participants WHERE match_id = ? AND user_id = ?', [matchId, targetId]);
        await db.query('INSERT INTO notifications (user_id, type, message) VALUES (?, "KICKED", "Vous avez été exclu du match.")', [targetId]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
};

exports.updateScore = async (req, res) => {
    const { matchId, scoreA, scoreB } = req.body;
    try {
        // CORRECTION: Mapped scoreA -> score_home and scoreB -> score_away
        await db.query('UPDATE matches SET score_home = ?, score_away = ? WHERE id = ?', [scoreA, scoreB, matchId]);
        res.json({ success: true });
    } catch(e) { 
        console.error(e);
        res.status(500).json({ error: "Erreur" }); 
    }
};

exports.updateTeams = async (req, res) => {
    const { matchId, composition } = req.body;
    try {
        for (const [userId, team] of Object.entries(composition)) {
            await db.query('UPDATE match_participants SET team = ? WHERE match_id = ? AND user_id = ?', [team, matchId, userId]);
        }
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: "Erreur" }); }
};

// --- CHAT ---
exports.getChat = async (req, res) => {
    try {
        const [msgs] = await db.query(`SELECT m.*, u.first_name, u.avatar_url, DATE_FORMAT(m.created_at, '%H:%i') as time FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.match_id = ? ORDER BY m.created_at ASC LIMIT 100`, [req.params.id]);
        res.json(msgs);
    } catch(e) { res.json([]); }
};

exports.postChat = async (req, res) => {
    try {
        await db.query(`INSERT INTO messages (match_id, sender_id, content) VALUES (?, ?, ?)`, [req.params.id, req.session.user.id, req.body.content]);
        res.json({ message: "Ok" });
    } catch(e) { res.status(500).json({}); }
};

// Ajouter ces fonctions dans matchController.js

exports.getUnreadNotifications = async (req, res) => {
    if (!req.session.user) return res.json([]);
    try {
        const [rows] = await db.query('SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 10', [req.session.user.id]);
        res.json(rows);
    } catch(e) { res.json([]); }
};

exports.markNotificationRead = async (req, res) => {
    if (!req.session.user) return res.status(401).json({});
    try {
        await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.body.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
};

exports.getReservations = async (req, res) => {
    if (!req.session.user) return res.status(401).json([]);
    
    try {
        const [rows] = await db.query(`
            SELECT DISTINCT 
                r.*, 
                t.name as pitch_name, 
                m.id as match_id, 
                m.match_code,
                mp.id as my_participation_id
            FROM match_participants mp 
            JOIN matches m ON mp.match_id = m.id 
            JOIN reservations r ON m.reservation_id = r.id 
            JOIN terrains t ON r.terrain_id = t.id 
            WHERE mp.user_id = ? 
              AND r.status != 'CANCELLED'
              AND mp.has_paid = 1
            ORDER BY r.start_time DESC
        `, [req.session.user.id]);
        
        res.json(rows);
        
    } catch(e) { 
        console.error("Erreur /api/reservations:", e);
        res.status(500).json([]); 
    }
};

exports.inviteFriend = async (req, res) => {
    if (!req.session.user) return res.status(401).json({});
    try {
        await db.query(`INSERT INTO match_participants (match_id, user_id, team_side, has_paid) VALUES (?, ?, 'A', 0) ON DUPLICATE KEY UPDATE team_side=team_side`, [req.body.matchId, req.body.friendId]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({}); }
};

exports.getChat = async (req, res) => {
    if (!req.session.user) return res.json([]);
    try {
        const [msgs] = await db.query(`SELECT m.*, u.first_name, u.avatar_url, DATE_FORMAT(m.created_at, '%H:%i') as time FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.match_id = ? ORDER BY m.created_at ASC LIMIT 100`, [req.params.id]);
        res.json(msgs);
    } catch (e) { res.json([]); }
};

exports.postChat = async (req, res) => {
    if (!req.session.user) return res.status(401).json({});
    try {
        await db.query(`INSERT INTO messages (match_id, sender_id, content) VALUES (?, ?, ?)`, [req.params.id, req.session.user.id, req.body.content]);
        res.json({ message: "Ok" });
    } catch (e) { res.status(500).json({}); }
};


// Modifier le nom des équipes
exports.updateTeamNames = async (req, res) => {
    const { matchId, nameA, nameB } = req.body;
    console.log(`📝 Update Team Names - Match ${matchId}: "${nameA}" vs "${nameB}"`);
    
    try {
        // Validation stricte
        if (!nameA || !nameB || nameA.trim() === '' || nameB.trim() === '') {
            return res.status(400).json({ error: "Les noms d'équipe ne peuvent pas être vides" });
        }
        
        if (nameA.length > 50 || nameB.length > 50) {
            return res.status(400).json({ error: "Les noms d'équipe sont trop longs (max 50 caractères)" });
        }
        
        // Vérification capitaine
        const [m] = await db.query('SELECT r.user_id as creator_id FROM matches m JOIN reservations r ON m.reservation_id = r.id WHERE m.id = ?', [matchId]);
        
        if (!m.length) {
            return res.status(404).json({ error: "Match introuvable" });
        }
        
        if (m[0].creator_id !== req.session.user.id) {
            console.log(`❌ User ${req.session.user.id} n'est pas le créateur`);
            return res.status(403).json({ error: "Seul le capitaine peut renommer les équipes" });
        }

        // Mise à jour avec trim
        await db.query('UPDATE matches SET team_name_a = ?, team_name_b = ? WHERE id = ?', [nameA.trim(), nameB.trim(), matchId]);
        
        // Vérification de la sauvegarde
        const [check] = await db.query('SELECT team_name_a, team_name_b FROM matches WHERE id = ?', [matchId]);
        console.log(`✅ Noms sauvegardés: ${check[0].team_name_a} vs ${check[0].team_name_b}`);
        
        res.json({ success: true, nameA: check[0].team_name_a, nameB: check[0].team_name_b });
        
    } catch (e) { 
        console.error("💥 Erreur updateTeamNames:", e);
        res.status(500).json({ error: "Erreur sauvegarde nom" }); 
    }
};

// Déplacer un joueur (remplace l'ancien changeSide qui était public)
exports.movePlayer = async (req, res) => {
    const { matchId, targetId, side } = req.body;
    console.log(`🔄 Move Player - Match ${matchId}: Joueur ${targetId} → Équipe ${side}`);
    
    try {
        // Validation complète des paramètres
        if (!matchId || !targetId || !side) {
            return res.status(400).json({ error: "Paramètres manquants" });
        }
        
        if (side !== 'A' && side !== 'B') {
            return res.status(400).json({ error: "Équipe invalide (A ou B uniquement)" });
        }
        
        // 1. Vérification capitaine
        const [m] = await db.query('SELECT r.user_id as creator_id FROM matches m JOIN reservations r ON m.reservation_id = r.id WHERE m.id = ?', [matchId]);
        
        if (!m.length) {
            return res.status(404).json({ error: "Match introuvable" });
        }
        
        if (m[0].creator_id !== req.session.user.id) {
            console.log(`❌ User ${req.session.user.id} n'est pas le créateur`);
            return res.status(403).json({ error: "Seul le capitaine peut déplacer les joueurs" });
        }
        
        // 2. Vérifier que le joueur existe dans le match
        const [player] = await db.query('SELECT team_side FROM match_participants WHERE match_id = ? AND user_id = ?', [matchId, targetId]);
        
        if (!player.length) {
            return res.status(404).json({ error: "Joueur introuvable dans ce match" });
        }
        
        // Si déjà dans cette équipe, pas besoin de bouger
        if (player[0].team_side === side) {
            console.log(`ℹ️ Joueur ${targetId} déjà dans l'équipe ${side}`);
            return res.json({ success: true, message: "Joueur déjà dans cette équipe" });
        }

        // 3. Vérification taille équipe de destination (Max 5)
        const [count] = await db.query('SELECT COUNT(*) as c FROM match_participants WHERE match_id = ? AND team_side = ?', [matchId, side]);
        
        if (count[0].c >= 5) {
            console.log(`❌ Équipe ${side} complète (${count[0].c}/5)`);
            return res.status(400).json({ error: "Équipe complète (5 joueurs maximum)" });
        }

        // 4. Mise à jour
        await db.query('UPDATE match_participants SET team_side = ? WHERE match_id = ? AND user_id = ?', [side, matchId, targetId]);
        
        console.log(`✅ Joueur ${targetId} déplacé vers équipe ${side}`);
        
        res.json({ success: true, message: "Joueur déplacé avec succès" });
        
    } catch (e) { 
        console.error("💥 Erreur movePlayer:", e);
        res.status(500).json({ error: "Erreur lors du déplacement du joueur" }); 
    }
};

//score final après match terminé 

exports.updateScoreFull = async (req, res) => {
    const { matchId, scoreA, scoreB, goalsData } = req.body;
    
    try {
        const [matchInfo] = await db.query(`
            SELECT r.user_id as creator_id FROM matches m 
            JOIN reservations r ON m.reservation_id = r.id 
            WHERE m.id = ?`, [matchId]);

        if (!matchInfo.length) return res.status(404).json({ error: "Match introuvable" });

        // Mise à jour du match en PLAYED
        await db.query('UPDATE matches SET score_home = ?, score_away = ?, status = "PLAYED" WHERE id = ?', [scoreA, scoreB, matchId]);

        let winningSide = scoreA > scoreB ? 'A' : (scoreB > scoreA ? 'B' : null);
        const [participants] = await db.query('SELECT user_id, team_side FROM match_participants WHERE match_id = ?', [matchId]);

        for (const p of participants) {
            const goals = goalsData[p.user_id] || 0;
            let xpGained = 0;

            // --- LOGIQUE XP ---
            if (winningSide === null) {
                xpGained = 0; // Match Nul
            } else if (p.team_side === winningSide) {
                xpGained = 20; // Victoire
            } else {
                xpGained = -20; // Défaite
            }

            xpGained += (goals * 5); // +5 XP par but

            // --- LOGIQUE NOTE (Base 5.0) ---
            // On ajuste la note selon l'XP (Ex: +20 XP monte la note de 1pt, -20 XP la descend de 1pt)
            let matchRating = 5.0 + (xpGained / 20); 
            matchRating = Math.max(0, Math.min(10, matchRating)); // On reste entre 0 et 10

            // Mise à jour match_participants (buts + note)
            await db.query('UPDATE match_participants SET goals = ?, rating = ? WHERE match_id = ? AND user_id = ?', [goals, matchRating, matchId, p.user_id]);

            // Mise à jour XP globale du joueur
            await db.query('UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?', [xpGained, p.user_id]);
        }

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Erreur serveur" });
    }
};



exports.submitVote = async (req, res) => {
    const { matchId, targetId, category } = req.body;
    const voterId = req.session.user.id;

    // 1. Sécurité : Pas de vote pour soi-même
    if (voterId === parseInt(targetId)) {
        return res.status(400).json({ error: "Interdit de voter pour soi-même" });
    }

    try {
        // 2. Enregistrement du vote dans la table match_votes
        await db.query(
            'INSERT INTO match_votes (match_id, voter_id, target_id, category) VALUES (?, ?, ?, ?)',
            [matchId, voterId, targetId, category]
        );

        // 3. RECALCUL DES TITRES EN TEMPS RÉEL (Transfert des points)
        // Cette fonction interne va attribuer les points uniquement aux leaders actuels
        await updateMatchWinners(matchId);

        res.json({ success: true });

    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: "Tu as déjà voté pour ce joueur sur ce match" });
        }
        console.error("Erreur vote:", e);
        res.status(500).json({ error: "Erreur serveur" });
    }
};

// --- FONCTION DE GESTION DES LEADERS (TRANSFERT DE POINTS) ---

async function updateMatchWinners(matchId) {
    try {
        // 1. On remet les compteurs à zéro pour ce match
        await db.query('UPDATE match_participants SET vote_rating_bonus = 0, vote_xp_bonus = 0 WHERE match_id = ?', [matchId]);

        // 2. On récupère les rôles et récompenses que TU as créés dans ton dashboard
        const [roles] = await db.query('SELECT category_key, xp_bonus, rating_bonus FROM vote_roles_config');

        // 3. On boucle sur chaque rôle pour trouver le gagnant et appliquer TES paramètres
        for (const role of roles) {
            const [winner] = await db.query(`
                SELECT target_id FROM match_votes 
                WHERE match_id = ? AND category = ? 
                GROUP BY target_id ORDER BY COUNT(*) DESC, RAND() LIMIT 1`, 
                [matchId, role.category_key]
            );

            if (winner.length > 0) {
                // On applique les gains d'XP et de Note enregistrés dans la BDD
                await db.query(`
                    UPDATE match_participants 
                    SET vote_rating_bonus = vote_rating_bonus + ?, 
                        vote_xp_bonus = vote_xp_bonus + ? 
                    WHERE match_id = ? AND user_id = ?`, 
                    [role.rating_bonus, role.xp_bonus, matchId, winner[0].target_id]
                );
            }
        }
    } catch (err) { console.error("Erreur recalcul dynamique:", err); }
}
exports.getVoteResults = async (req, res) => {
    const { id } = req.params; // ID du match
    try {
        const [votes] = await db.query(`
            SELECT target_id, category, COUNT(*) as count 
            FROM match_votes 
            WHERE match_id = ? 
            GROUP BY target_id, category`, [id]);
        res.json(votes);
    } catch (e) { res.status(500).json([]); }
};

// Permet aux joueurs de voir les trophées disponibles pour voter
exports.getPublicVoteRoles = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT label, category_key FROM vote_roles_config');
        res.json(rows);
    } catch (e) {
        res.status(500).json({ error: "Erreur rôles" });
    }
};