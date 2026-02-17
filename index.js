require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

// --- IMPORT DES ROUTES ---
const authRoutes = require('./routes/authRoutes');
const playerRoutes = require('./routes/playerRoutes');
const matchRoutes = require('./routes/matchRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// --- MIDDLEWARES ---
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// 1. D'abord les fichiers statiques du site (HTML, CSS, JS)
app.use(express.static('public'));

// 2. CORRECTION : Rendre le dossier 'uploads' accessible pour les avatars
// Cela permet d'accéder à http://localhost:3000/uploads/avatar-xyz.png
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(session({
    secret: 'realfive_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// --- ROUTAGE ---
app.use('/', authRoutes);        
app.use('/', playerRoutes);      
app.use('/', matchRoutes);       
app.use('/api/admin', adminRoutes);

// --- ROUTE RACINE ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- LANCEMENT ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Serveur RealFive lancé sur http://localhost:${PORT}`));