const db = require('../config/db');
const fs = require('fs');
const path = require('path');

// ==========================================
// 1. ANALYTICS & KPIS (CORRIGÉ POUR NaN)
// ==========================================
exports.getAdvancedStats = async (req, res) => {
    try {
        const [complex] = await db.query('SELECT id FROM complexes WHERE owner_id = ?', [req.session.user.id]);
        if(!complex.length) return res.json({ revenue: {current:0, last:0, growth:0}, bookings: 0, occupancy: 0 });
        const cId = complex[0].id;

        // KPI 1: Chiffre d'Affaires (Force le type Number)
      const [revenueCurrent] = await db.query(`
    SELECT COALESCE(SUM(total_price), 0) as total FROM reservations r 
    JOIN terrains t ON r.terrain_id = t.id 
    WHERE t.complex_id = ? 
    AND r.status = 'CONFIRMED' 
    AND r.payment_status = 'PAID' -- Ajoutez cette ligne
    AND MONTH(r.start_time) = MONTH(CURRENT_DATE())
`, [cId]);


        const [revenueLast] = await db.query(`
            SELECT COALESCE(SUM(total_price), 0) as total FROM reservations r 
            JOIN terrains t ON r.terrain_id = t.id 
            WHERE t.complex_id = ? AND r.status = 'CONFIRMED' 
            AND MONTH(r.start_time) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH)
        `, [cId]);

        // KPI 2: Taux d'Occupation
        const [occupancy] = await db.query(`
            SELECT 
                COUNT(*) as total_slots,
                SUM(CASE WHEN r.status = 'CONFIRMED' THEN 1 ELSE 0 END) as booked_slots
            FROM reservations r
            JOIN terrains t ON r.terrain_id = t.id
            WHERE t.complex_id = ? AND r.start_time > DATE_SUB(NOW(), INTERVAL 30 DAY)
        `, [cId]);
        
        // Sécurité division par zéro
        const totalSlots = occupancy[0]?.total_slots || 0;
        const bookedSlots = occupancy[0]?.booked_slots || 0;
        const occupationRate = totalSlots > 0 
            ? ((bookedSlots / totalSlots) * 100).toFixed(1) 
            : 0;

        // KPI 3: Répartition
        const [sportStats] = await db.query(`
            SELECT t.sport_type, COUNT(*) as count 
            FROM reservations r 
            JOIN terrains t ON r.terrain_id = t.id 
            WHERE t.complex_id = ? AND r.status = 'CONFIRMED'
            GROUP BY t.sport_type
        `, [cId]);

        // Préparation des données propres (Conversion String -> Float)
        const currentRev = parseFloat(revenueCurrent[0]?.total || 0);
        const lastRev = parseFloat(revenueLast[0]?.total || 0);

        res.json({
            revenue: {
                current: currentRev,
                last: lastRev,
                growth: lastRev > 0 ? (((currentRev - lastRev) / lastRev) * 100).toFixed(1) : 0
            },
            occupancy: occupationRate,
            bookings_count: bookedSlots,
            sports_dist: sportStats
        });

    } catch (e) {
        console.error("Erreur Stats:", e);
        res.status(500).json({ error: "Erreur calcul statistiques" });
    }
};

exports.getChartData = async (req, res) => {
    const days = parseInt(req.query.days) || 30;
    try {
        const [complex] = await db.query('SELECT id FROM complexes WHERE owner_id = ?', [req.session.user.id]);
        if(!complex.length) return res.json({ labels: [], data: [] });

        const [rows] = await db.query(`
            SELECT DATE_FORMAT(start_time, '%d/%m') as date, SUM(total_price) as total 
            FROM reservations r JOIN terrains t ON r.terrain_id = t.id 
            WHERE t.complex_id = ? AND r.status = 'CONFIRMED' AND r.start_time >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY DATE(start_time) ORDER BY start_time ASC
        `, [complex[0].id, days]);

        res.json({
            labels: rows.map(r => r.date),
            data: rows.map(r => parseFloat(r.total || 0)) // Force float
        });
    } catch (e) { res.json({ labels: [], data: [] }); }
};

// ==========================================
// 2. CALENDRIER & RÉSERVATIONS
// ==========================================
exports.getReservations = async (req, res) => {
    try {
        const [complex] = await db.query('SELECT id FROM complexes WHERE owner_id = ?', [req.session.user.id]);
        if(!complex.length) return res.json([]);

        const [rows] = await db.query(`
            SELECT 
                r.id, r.start_time, r.end_time, r.total_price, r.status, r.source, r.payment_status,
                t.name as pitch_name, t.sport_type, t.id as pitch_id,
                u.first_name, u.last_name, u.email, u.phone, u.client_tag,
                m.match_code
            FROM reservations r 
            JOIN terrains t ON r.terrain_id = t.id 
            JOIN users u ON r.user_id = u.id
            LEFT JOIN matches m ON r.id = m.reservation_id
            WHERE t.complex_id = ? AND r.status != 'CANCELLED'
            ORDER BY r.start_time DESC
        `, [complex[0].id]);
        
        res.json(rows);
    } catch(e) { console.error(e); res.json([]); }
};

exports.createReservation = async (req, res) => {
    const { terrain_id, start_time, end_time, client_name, source, price_override } = req.body;
    
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Formatage des dates pour MySQL
        const start = new Date(start_time);
        const end = new Date(end_time);
        const sqlStart = start.toISOString().slice(0, 19).replace('T', ' ');
        const sqlEnd = end.toISOString().slice(0, 19).replace('T', ' ');

        // 2. Vérification des collisions
        const [conflicts] = await connection.query(
            `SELECT id FROM reservations WHERE terrain_id = ? AND status != 'CANCELLED' AND ((start_time < ? AND end_time > ?)) FOR UPDATE`, 
            [terrain_id, sqlEnd, sqlStart]
        );
        if (conflicts.length > 0) throw new Error("Créneau indisponible (collision détectée)");

        // 3. Calcul du prix selon la nouvelle grille (SMART vs PRIME)
        let finalPrice = 0;
        if (price_override) {
            finalPrice = parseFloat(price_override);
        } else {
            const durationMinutes = (end - start) / (1000 * 60);
            const startHour = start.getHours();
            const day = start.getDay(); // 0=Dimanche, 6=Samedi

            // Définition Heures Pleines (PRIME) : Sam-Dim OU (Lun-Ven entre 18h et 22h)
            const isWeekend = (day === 0 || day === 6);
            const isPeakTime = isWeekend || (startHour >= 18 && startHour < 23);

            if (isPeakTime) {
                // Tarifs PRIME
                if (durationMinutes <= 60) finalPrice = 9;
                else if (durationMinutes <= 90) finalPrice = 13;
                else finalPrice = 17; // 2h
            } else {
                // Tarifs SMART (Heures Creuses)
                if (durationMinutes <= 60) finalPrice = 7;
                else if (durationMinutes <= 90) finalPrice = 10;
                else finalPrice = 13; // 2h
            }
        }

        // 4. Insertion de la réservation
        const [resRes] = await connection.query(
            `INSERT INTO reservations (user_id, terrain_id, start_time, end_time, total_price, status, payment_mode, source, payment_status) 
             VALUES (?, ?, ?, ?, ?, 'CONFIRMED', 'FULL', ?, 'UNPAID')`, 
            [req.session.user.id, terrain_id, sqlStart, sqlEnd, finalPrice, source || 'GUICHET']
        );

        // 5. Création automatique du match
        const matchCode = 'ADM-' + Math.floor(10000 + Math.random() * 90000);
        await connection.query(
            `INSERT INTO matches (reservation_id, status, match_code) VALUES (?, 'SCHEDULED', ?)`, 
            [resRes.insertId, `${client_name} (${matchCode})`]
        );

        await connection.commit();
        res.json({ success: true, id: resRes.insertId, calculatedPrice: finalPrice });

    } catch (e) { 
        await connection.rollback();
        res.status(500).json({ error: e.message }); 
    } finally {
        connection.release();
    }
};

exports.moveReservation = async (req, res) => {
    const { id, start_time, end_time } = req.body;
    try {
        const sqlStart = start_time.replace('T', ' ').slice(0, 19);
        const sqlEnd = end_time.replace('T', ' ').slice(0, 19);
        await db.query('UPDATE reservations SET start_time = ?, end_time = ? WHERE id = ?', [sqlStart, sqlEnd, id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Erreur déplacement" }); }
};

exports.cancelReservation = async (req, res) => {
    try {
        await db.query("UPDATE reservations SET status = 'CANCELLED' WHERE id = ?", [req.body.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: "Erreur annulation" }); }
};

// ==========================================
// 3. GESTION TERRAINS (FONCTIONS MANQUANTES AJOUTÉES)
// ==========================================
exports.getTerrains = async (req, res) => {
    try {
        const [complex] = await db.query('SELECT id FROM complexes WHERE owner_id = ?', [req.session.user.id]);
        if(!complex.length) return res.json([]);
        // MODIFICATION : On ajoute "AND is_active = 1" pour masquer les terrains supprimés
        const [rows] = await db.query('SELECT * FROM terrains WHERE complex_id = ? AND is_active = 1 ORDER BY priority ASC', [complex[0].id]);
        res.json(rows);
    } catch(e) { res.json([]); }
};

// DANS adminController.js
exports.addTerrain = async (req, res) => {
    const { 
        name, sport_type, surface_type, is_indoor, has_camera, features,
        p_creuse_1h, p_creuse_1h30, p_creuse_2h,
        p_pleine_1h, p_pleine_1h30, p_pleine_2h,
        p_weekend_1h, p_weekend_1h30, p_weekend_2h 
    } = req.body;

    try {
        const [complex] = await db.query('SELECT id FROM complexes WHERE owner_id = ?', [req.session.user.id]);
        const featuresJson = JSON.stringify(features);

        await db.query(`
            INSERT INTO terrains 
            (complex_id, name, sport_type, surface_type, is_indoor, has_camera, features,
             p_creuse_1h, p_creuse_1h30, p_creuse_2h,
             p_pleine_1h, p_pleine_1h30, p_pleine_2h,
             p_weekend_1h, p_weekend_1h30, p_weekend_2h,
             hourly_rate, maintenance_status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'AVAILABLE')`, 
            [
                complex[0].id, name, sport_type, surface_type, is_indoor, has_camera, featuresJson,
                p_creuse_1h, p_creuse_1h30, p_creuse_2h,
                p_pleine_1h, p_pleine_1h30, p_pleine_2h,
                p_weekend_1h, p_weekend_1h30, p_weekend_2h,
                p_creuse_1h // On garde hourly_rate pour la compatibilité
            ]
        );
        res.json({ success: true });
    } catch(e) { console.error(e); res.status(500).json({ error: "Erreur ajout" }); }
};

// DANS adminController.js
exports.updateTerrain = async (req, res) => {
    const { 
        name, sport_type, surface_type, is_indoor, has_camera, features, maintenance_status,
        p_creuse_1h, p_creuse_1h30, p_creuse_2h,
        p_pleine_1h, p_pleine_1h30, p_pleine_2h,
        p_weekend_1h, p_weekend_1h30, p_weekend_2h 
    } = req.body;

    try {
        const featuresJson = JSON.stringify(features);

        await db.query(`
            UPDATE terrains SET 
            name=?, sport_type=?, surface_type=?, is_indoor=?, has_camera=?, features=?, maintenance_status=?,
            p_creuse_1h=?, p_creuse_1h30=?, p_creuse_2h=?,
            p_pleine_1h=?, p_pleine_1h30=?, p_pleine_2h=?,
            p_weekend_1h=?, p_weekend_1h30=?, p_weekend_2h=?,
            hourly_rate=?
            WHERE id=?`, 
            [
                name, sport_type, surface_type, is_indoor, has_camera, featuresJson, maintenance_status,
                p_creuse_1h, p_creuse_1h30, p_creuse_2h,
                p_pleine_1h, p_pleine_1h30, p_pleine_2h,
                p_weekend_1h, p_weekend_1h30, p_weekend_2h,
                p_creuse_1h, req.params.id
            ]
        );
        res.json({ success: true });
    } catch(e) { console.error(e); res.status(500).json({ error: "Erreur mise à jour" }); }
};

exports.deleteTerrain = async (req, res) => {
    try {
        // MODIFICATION : On fait un UPDATE (Soft Delete) au lieu d'un DELETE
        await db.query('UPDATE terrains SET is_active = 0 WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch(e) { 
        console.error(e);
        res.status(500).json({ error: "Erreur lors de la suppression" }); 
    }
};

exports.toggleTerrain = async (req, res) => {
    try {
        const { id, maintenance_status } = req.body;
        await db.query('UPDATE terrains SET maintenance_status = ? WHERE id = ?', [maintenance_status, id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: "Erreur changement statut" }); }
};

// ==========================================
// 4. CRM & UTILISATEURS
// ==========================================
exports.searchUsers = async (req, res) => {
    const q = '%' + req.query.q + '%';
    try {
        const [users] = await db.query(`
            SELECT id, first_name, last_name, email, phone, role, avatar_url, 
                   friend_code, loyalty_points, client_tag, wallet_balance as total_spent
            FROM users 
            WHERE (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)
            ORDER BY created_at DESC LIMIT 20
        `, [q, q, q, q]);
        res.json(users);
    } catch(e) { res.json([]); }
};

// ==========================================
// 5. CONFIGURATION & IMAGES
// ==========================================
exports.getMyComplex = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM complexes WHERE owner_id = ?', [req.session.user.id]);
        res.json(rows[0] || {});
    } catch (e) { res.status(500).json({ error: "Erreur serveur" }); }
};

// DANS adminController.js

// adminController.js

// DANS adminController.js
exports.updateComplex = async (req, res) => {
    try {
        const userId = req.session.user.id;
        
        // 1. On vérifie si l'admin a déjà un complexe
        const [complexRows] = await db.query('SELECT id FROM complexes WHERE owner_id = ?', [userId]);
        
        const d = req.body;
        const f = req.files;

        // Gestion des images (on garde l'ancienne si pas de nouvelle)
        let logoPath = d.existing_logo_url || null;
        let coverPath = d.existing_cover_url || null;
        
        if (f && f['logo']) logoPath = '/uploads/' + f['logo'][0].filename;
        if (f && f['cover']) coverPath = '/uploads/' + f['cover'][0].filename;

        if (complexRows.length > 0) {
            // --- CAS 1 : LE COMPLEXE EXISTE -> MISE À JOUR (UPDATE) ---
            const complexId = complexRows[0].id;
            await db.query(
                `UPDATE complexes SET 
                    name=?, description=?, address=?, city=?, zip_code=?, 
                    phone_contact=?, email=?, website=?,
                    open_time=?, close_time=?, peak_start=?, peak_end=?,
                    logo_url=?, cover_image_url=?, complexe_image_url=?
                 WHERE id=?`,
                [
                    d.name, d.description, d.address, d.city, d.zip_code,
                    d.phone, d.email, d.website, d.open_time, d.close_time, 
                    d.peak_start, d.peak_end, logoPath, coverPath, coverPath, complexId
                ]
            );
        } else {
            // --- CAS 2 : NOUVEL ADMIN -> CRÉATION (INSERT) ---
            await db.query(
                `INSERT INTO complexes 
                (owner_id, name, description, address, city, zip_code, phone_contact, email, website, 
                 open_time, close_time, peak_start, peak_end, logo_url, cover_image_url, complexe_image_url) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    userId, d.name, d.description, d.address, d.city, d.zip_code,
                    d.phone, d.email, d.website, d.open_time, d.close_time, 
                    d.peak_start, d.peak_end, logoPath, coverPath, coverPath
                ]
            );
        }
        res.json({ success: true });
    } catch (e) {
        console.error("Crash updateComplex:", e);
        res.status(500).json({ error: "Erreur lors de l'enregistrement du complexe" });
    }
};
// ==========================================
// 6. MODULE FINANCE & COMPTABILITÉ
// ==========================================
exports.getFinanceData = async (req, res) => {
    try {
        const [complex] = await db.query('SELECT id FROM complexes WHERE owner_id = ?', [req.session.user.id]);
        if(!complex.length) return res.json({ transactions: [], stats: {} });
        
        // 1. Récupérer toutes les transactions (Réservations passées et futures)
        const [rows] = await db.query(`
            SELECT r.id, r.created_at, r.total_price, r.payment_status, r.payment_method, 
                   u.first_name, u.last_name, t.name as terrain_name
            FROM reservations r
            JOIN users u ON r.user_id = u.id
            JOIN terrains t ON r.terrain_id = t.id
            WHERE t.complex_id = ?
            ORDER BY r.created_at DESC
        `, [complex[0].id]);

        // 2. Calcul des KPIs Financiers
        let totalRevenue = 0;
        let pendingPayment = 0;
        let cashTotal = 0;
        let cardTotal = 0;

        rows.forEach(r => {
            const amount = parseFloat(r.total_price);
            if (r.payment_status === 'PAID') {
                totalRevenue += amount;
                if (r.payment_method === 'CASH') cashTotal += amount;
                else cardTotal += amount;
            } else if (r.payment_status === 'UNPAID' || r.payment_status === 'PENDING_PAYMENT') {
                pendingPayment += amount;
            }
        });

        res.json({
            transactions: rows,
            stats: {
                revenue: totalRevenue.toFixed(2),
                pending: pendingPayment.toFixed(2),
                cash: cashTotal.toFixed(2),
                card: cardTotal.toFixed(2)
            }
        });
    } catch(e) { console.error(e); res.status(500).json({error: "Erreur finance"}); }
};

// Génération de données pour facture (Simple)
exports.getInvoiceData = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.*, u.first_name, u.last_name, u.email, u.phone, t.name as terrain_name, c.name as complex_name, c.address as complex_address
            FROM reservations r
            JOIN users u ON r.user_id = u.id
            JOIN terrains t ON r.terrain_id = t.id
            JOIN complexes c ON t.complex_id = c.id
            WHERE r.id = ?
        `, [req.params.id]);
        
        if(!rows.length) return res.status(404).json({error: "Introuvable"});
        res.json(rows[0]);
    } catch(e) { res.status(500).json({error: "Erreur facture"}); }
};

// ==========================================
// 7. MARKETING & CODES PROMO
// ==========================================
exports.getPromos = async (req, res) => {
    try {
        const [complex] = await db.query('SELECT id FROM complexes WHERE owner_id = ?', [req.session.user.id]);
        if(!complex.length) return res.json([]);
        
        const [rows] = await db.query('SELECT * FROM promo_codes WHERE complex_id = ? ORDER BY created_at DESC', [complex[0].id]);
        res.json(rows);
    } catch(e) { res.status(500).json([]); }
};

// VERSION MISE À JOUR : Ajout de la date de début (starts_at)
exports.createPromo = async (req, res) => {
    // On récupère starts_at envoyé par le client
    const { code, type, value, max_uses, starts_at, expires_at } = req.body;
    
    try {
        const [complex] = await db.query('SELECT id FROM complexes WHERE owner_id = ?', [req.session.user.id]);
        
        if (!complex.length) {
            return res.status(404).json({ error: "Complexe introuvable" });
        }

        // On ajoute la colonne starts_at dans l'INSERT
        await db.query(`
            INSERT INTO promo_codes (complex_id, code, starts_at, discount_type, value, max_uses, expires_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?)`, 
            [
                complex[0].id, 
                code.toUpperCase(), 
                starts_at, // La nouvelle valeur
                type, 
                value, 
                max_uses, 
                expires_at
            ]
        );

        res.json({ success: true });
    } catch(e) { 
        console.error("Erreur SQL Promo:", e);
        res.status(500).json({ error: "Erreur lors de la création du code promo" }); 
    }
};

exports.deletePromo = async (req, res) => {
    try {
        await db.query('DELETE FROM promo_codes WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: "Impossible de supprimer" }); }
};

/*** ---------------------------------------------------------------------- */
/***  SANCTIONS : 3 fonctions exportées pour le router                        */
/*** ---------------------------------------------------------------------- */

exports.getSanctions = async (req, res) => {
    try {
        /* 1️⃣ Récupérer l’ID du complexe du propriétaire connecté */
        const [complex] = await db.query(
            'SELECT id FROM complexes WHERE owner_id = ?',
            [req.session.user.id]
        );
        if (!complex || !complex.length) {
            return res.json([]);                     // rien trouvé → liste vide
        }
        const complexId = complex[0].id;

        /* 2️⃣ Requête qui joint :
             - la sanction proprement dite
             - le joueur concerné     (first_name, last_name, email)
             - l’administrateur qui a créé la sanction (prenom, nom)   */
        const [rows] = await db.query(`
            SELECT
                s.*,
                CONCAT(u.first_name,' ',u.last_name) AS player_name,
                u.email                               AS player_email,
                CONCAT(a.first_name,' ',a.last_name) AS admin_name
            FROM player_sanctions s
            LEFT JOIN users u ON s.user_id      = u.id
            LEFT JOIN users a ON s.created_by  = a.id
            WHERE s.complex_id = ?
            ORDER BY s.created_at DESC
        `, [complexId]);

        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || 'Erreur serveur' });
    }
};

exports.createSanction = async (req, res) => {
    const { user_id, reason, ban_type, end_date } = req.body;

    /* Validation minimale */
    if (!user_id || !reason || !ban_type) {
        return res.status(400).json({ error: 'user_id, reason et ban_type requis' });
    }

    try {
        /* 1️⃣ Le complexe du propriétaire */
        const [complex] = await db.query(
            'SELECT id FROM complexes WHERE owner_id = ?',
            [req.session.user.id]
        );
        if (!complex || !complex.length) {
            return res.status(400).json({ error: 'Complexe introuvable' });
        }
        const complexId = complex[0].id;

        /* 2️⃣ INSERT dans la table player_sanctions */
        const [result] = await db.query(`
            INSERT INTO player_sanctions
                (user_id, complex_id, reason, ban_type, start_date, end_date, created_by)
            VALUES
                (?, ?, ?, ?, NOW(), ?, ?)
        `, [
            user_id,
            complexId,
            reason,
            ban_type,
            end_date || null,      // null si « permanent »
            req.session.user.id
        ]);

        res.json({ success: true, id: result.insertId });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || 'Erreur création sanction' });
    }
};

exports.deleteSanction = async (req, res) => {
    const { id } = req.params;

    try {
        /* 1️⃣ Le complexe du propriétaire */
        const [complex] = await db.query(
            'SELECT id FROM complexes WHERE owner_id = ?',
            [req.session.user.id]
        );
        if (!complex || !complex.length) {
            return res.status(400).json({ error: 'Complexe introuvable' });
        }
        const complexId = complex[0].id;

        /* 2️⃣ Suppression de la sanction (soft – mise à jour avec is_active = FALSE) */
        await db.query(`
            UPDATE player_sanctions
            SET is_active = FALSE
            WHERE id = ? AND complex_id = ?
        `, [id, complexId]);

        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message || 'Erreur suppression sanction' });
    }
};


exports.uploadImages = async (req, res) => { /* Code inchangé */ res.json({success:true}); };
exports.getGallery = async (req, res) => { res.json([]); };
exports.deleteGalleryImage = async (req, res) => { res.json({success:true}); };
exports.updateSimplePricing = async (req, res) => { res.json({success:true}); };
exports.getPricingRules = async (req, res) => { res.json([]); };



// Récupérer les réglages de fidélité actuels
exports.getLoyaltySettings = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT config FROM loyalty_settings WHERE id = 1');
        if (rows.length > 0) {
            res.json({ config: JSON.parse(rows[0].config) });
        } else {
            res.json({ config: null });
        }
    } catch (e) {
        res.status(500).json({ error: "Erreur lors de la récupération des réglages" });
    }
};

// Enregistrer les nouveaux réglages (Coefficients + Paliers)
exports.updateLoyaltySettings = async (req, res) => {
    const config = JSON.stringify(req.body); // Contient coeffMatch, coeffStreak et rewards
    try {
        await db.query(
            'INSERT INTO loyalty_settings (id, config) VALUES (1, ?) ON DUPLICATE KEY UPDATE config = ?',
            [config, config]
        );
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Erreur lors de la sauvegarde" });
    }
};

// Récupérer tous les rôles configurés
exports.getVoteRoles = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM vote_roles_config ORDER BY id ASC');
        res.json(rows);
    } catch (e) { res.status(500).json({ error: "Erreur lecture rôles" }); }
};

// Créer un nouveau rôle
exports.createVoteRole = async (req, res) => {
    const { label, category_key, xp_bonus, rating_bonus } = req.body;
    try {
        await db.query(
            'INSERT INTO vote_roles_config (label, category_key, xp_bonus, rating_bonus) VALUES (?, ?, ?, ?)',
            [label, category_key.toLowerCase(), xp_bonus, rating_bonus]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Erreur création rôle" }); }
};

// Supprimer un rôle
exports.deleteVoteRole = async (req, res) => {
    try {
        await db.query('DELETE FROM vote_roles_config WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Erreur suppression" }); }
};


// DANS adminController.js
exports.toggleComplexStatus = async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { isMaintenance } = req.body;

        // LOGIQUE : 
        // Si isMaintenance est coché (true) -> is_validated = 0 (Masqué)
        // Si isMaintenance est décoché (false) -> is_validated = 1 (Visible)
        const isValidated = isMaintenance ? 0 : 1;

        await db.query(
            'UPDATE complexes SET is_validated = ? WHERE owner_id = ?',
            [isValidated, userId]
        );
        
        res.json({ success: true, newState: isValidated });
    } catch (e) {
        console.error("Erreur toggle:", e);
        res.status(500).json({ error: "Erreur lors du changement de statut" });
    }
};