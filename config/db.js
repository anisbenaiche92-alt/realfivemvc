require('dotenv').config();
const mysql = require('mysql2/promise');

// Vérification explicite que les variables sont chargées
if (!process.env.DB_HOST) {
  console.error('❌ ERREUR FATALE : DB_HOST non défini');
  process.exit(1);
}

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false // À remplacer par true en production avec le CA
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test de connexion
db.getConnection()
  .then(conn => {
    console.log(`✅ Connecté à la base de données : ${process.env.DB_NAME} sur ${process.env.DB_HOST}`);
    conn.release();
  })
  .catch(err => {
    console.error('❌ Erreur de connexion BDD :', err);
  });

module.exports = db;
