// authRoutes.js CORRIGÉ
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const playerController = require('../controllers/playerController');
const { isAuthenticated } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// ========== ROUTES PUBLIQUES ==========
router.post('/register', authController.register);
router.post('/verify-account', authController.verifyAccount);
router.post('/login', authController.login);
router.post('/login-2fa', authController.login2FA);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password-confirm', authController.resetPasswordConfirm);

// ========== ROUTES AUTHENTIFIÉES ==========
router.use(isAuthenticated); // ✅ TOUTES LES ROUTES SUIVANTES NÉCESSITENT AUTH

router.post('/logout', authController.logout);
router.get('/api/me', authController.getMe);
router.get('/api/profile', authController.getProfile);
router.post('/api/profile', upload.single('avatar'), authController.updateProfile);

// Stats joueur
router.get('/api/stats/me', authController.getPlayerStats);
router.get('/api/stats/user/:id', authController.getUserStats);

// ⚠️ SUPPRIMER LES ROUTES AMIS D'ICI (déjà dans playerRoutes.js)

module.exports = router;