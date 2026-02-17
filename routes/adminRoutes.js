const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthorized, isAdmin } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

router.use(isAuthorized);

// Complexe & Stats
router.get('/my-complex', adminController.getMyComplex);
router.get('/stats', adminController.getAdvancedStats); // Route mise à jour V2
router.get('/chart-data', adminController.getChartData);

router.post('/my-complex', upload.fields([
    { name: 'logo', maxCount: 1 }, 
    { name: 'cover', maxCount: 1 }
]), adminController.updateComplex);

// Gestion Terrains
router.get('/terrains', adminController.getTerrains);
router.post('/terrains/add', adminController.addTerrain);
router.put('/terrains/:id', adminController.updateTerrain);
router.delete('/terrains/:id', adminController.deleteTerrain);
router.post('/terrains/toggle', adminController.toggleTerrain);

// Calendrier
router.get('/reservations', adminController.getReservations);
router.post('/reservations/create', adminController.createReservation);
router.put('/reservations/move', adminController.moveReservation);
router.post('/reservations/cancel', adminController.cancelReservation);

// Tarifs & Galerie
router.post('/pricing/simple', adminController.updateSimplePricing);
router.get('/pricing-rules', adminController.getPricingRules);
router.post('/complex/upload-images', upload.array('images', 10), adminController.uploadImages);
router.get('/complex/gallery', adminController.getGallery);
router.delete('/complex/gallery/:id', adminController.deleteGalleryImage);
// Finance
router.get('/finance/overview', adminController.getFinanceData);
router.get('/finance/invoice/:id', adminController.getInvoiceData);

// Users (CRM)
router.get('/users/search', isAdmin, adminController.searchUsers);

// Gestion Codes Promo
router.get('/marketing/promos', adminController.getPromos);
router.post('/marketing/promos', adminController.createPromo);
router.delete('/marketing/promos/:id', adminController.deletePromo);

// Sanctions Utilisateurs
router.get('/sanctions', adminController.getSanctions);
router.post('/sanctions', adminController.createSanction);   // ← change
router.delete('/sanctions/:id', adminController.deleteSanction); // ← change

// Gestion des rôles de vote
router.get('/vote-roles', adminController.getVoteRoles);
router.post('/vote-roles', adminController.createVoteRole);
router.delete('/vote-roles/:id', adminController.deleteVoteRole);

module.exports = router;