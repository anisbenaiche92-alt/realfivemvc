require('dotenv').config();
const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME, // <--- C'est ici qu'il choisit la base
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

db.getConnection()
    .then(conn => {
        // 👇 AJOUTE CETTE LIGNE POUR VOIR LE NOM DE LA BASE 👇
        console.log(`✅ Connecté à la Base de Données : ${process.env.DB_NAME}`);
        conn.release();
    })
    .catch(err => {
        console.error("❌ Erreur de connexion BDD :", err);
    });

module.exports = db;