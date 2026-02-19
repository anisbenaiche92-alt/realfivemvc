const db = require('../config/db');

// --- SETTINGS (Correction : On utilise la table app_settings comme avant) ---
exports.getSettings = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM app_settings WHERE id = 1');
        // On renvoie la ligne brute, comme l'ancien index.js
        res.json(rows[0] || {});
    } catch (e) {
        console.error("Erreur settings:", e);
        // Fallback pour éviter le crash 500 si la table est vide
        res.json({ company_name: 'REALFIVE', city: 'ARENA', primary_color: '#4DFF99' });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        await db.query(`UPDATE app_settings SET company_name=?, city=?, primary_color=?, hero_title=?, opening_date=? WHERE id=1`, 
        [req.body.company_name, req.body.city, req.body.primary_color, req.body.hero_title, req.body.opening_date]);
        res.json({ message: "Saved" });
    } catch (e) { res.status(500).json({ error: "Erreur sauvegarde" }); }
};

// --- NOTIFICATIONS ---
exports.getNotifications = async (req, res) => {
    try {
        // Récupère les notifs non lues en priorité
        const [rows] = await db.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY is_read ASC, created_at DESC LIMIT 20', [req.session.user.id]);
        res.json(rows);
    } catch (e) { res.json([]); }
};

exports.markNotificationRead = async (req, res) => {
    try {
        await db.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.body.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Erreur" }); }
};

// --- COMPLEXES & TERRAINS PUBLIC ---
exports.getComplexes = async (req, res) => {
    const { sport } = req.query;
    let sql = 'SELECT * FROM complexes WHERE is_validated = 1';
    let params = [];
    if (sport) {
        sql = `SELECT DISTINCT c.* FROM complexes c JOIN terrains t ON c.id = t.complex_id WHERE c.is_validated = 1 AND t.sport_type = ? AND t.is_active = 1`;
        params.push(sport);
    }
    const [rows] = await db.query(sql, params);
    res.json(rows);
};

// mainController.js
exports.getComplexTerrains = async (req, res) => {
    const { sport, date, time_slot, duration } = req.query;
    let sql = 'SELECT * FROM terrains WHERE complex_id = ? AND is_active = 1';
    const params = [req.params.id];
    if (sport) { sql += ' AND sport_type = ?'; params.push(sport); }
    
    const [terrains] = await db.query(sql, params);
    
    // Logique de disponibilité et prix
    const result = await Promise.all(terrains.map(async (t) => {
        const features = t.features ? JSON.parse(t.features) : { camera: t.has_camera === 1, lighting: true, heating: t.is_indoor === 1 };
        let isAvailable = true;
        
        if (date && time_slot && duration) {
            const start = `${date} ${time_slot}:00`;
            const end = new Date(new Date(start).getTime() + (duration * 60 * 60 * 1000)).toISOString().slice(0, 19).replace('T', ' ');
            const [conflicts] = await db.query(
                'SELECT id FROM reservations WHERE terrain_id = ? AND status NOT IN ("CANCELLED", "EXPIRED") AND start_time < ? AND end_time > ?', 
                [t.id, end, start]
            );
            isAvailable = conflicts.length === 0;
        }
        return { ...t, features, isAvailable, finalPrice: parseFloat(t.hourly_rate) };
    }));
    
    // Tri par caméra et prix
    result.sort((a, b) => {
        if (a.features.camera && !b.features.camera) return -1;
        if (!a.features.camera && b.features.camera) return 1;
        return a.finalPrice - b.finalPrice;
    });

    res.json(result);
};


exports.getPricingRulesPublic = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM pricing_rules WHERE complex_id = ? AND is_active = 1', [req.params.complexId]);
        res.json(rows);
    } catch(e) { res.json([]); }
};