const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const mainController = require('../controllers/mainController');
router.post('/api/event-request', matchController.createEventRequest);

// --- AJOUTE CES DEUX LIGNES ICI ---
const adminController = require('../controllers/adminController');
const authController = require('../controllers/authController');
const upload = require('../middlewares/multer-config'); // <--- INDISPENSABLE POUR LES IMAGES
const { isAuthenticated } = require('../middlewares/auth');

// --- PUBLIC ---
router.get('/api/settings', mainController.getSettings);
router.post('/api/settings', mainController.updateSettings);
router.get('/api/complexes', mainController.getComplexes);
router.get('/api/complexes/:id/terrains', mainController.getComplexTerrains);

router.get('/api/pricing-rules/:complexId', mainController.getPricingRulesPublic);



// --- AUTH (Toutes les routes en dessous demandent d'être connecté) ---
router.use(isAuthenticated); 

// --- GESTION DU COMPLEXE (ADMIN) ---
// Route pour récupérer les infos actuelles du complexe
router.get('/api/admin/my-complex', adminController.getMyComplex);

// Route pour créer ou mettre à jour le complexe (avec gestion du Logo et de la Cover)
router.post('/api/admin/my-complex', upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'cover', maxCount: 1 }
]), adminController.updateComplex);
router.post('/api/admin/my-complex/toggle', adminController.toggleComplexStatus);

// --- SECTION FIDÉLITÉ & STATS (NOUVEAU) ---
// Récupère les stats et la carte de fidélité pour le joueur
router.get('/api/stats/me', authController.getPlayerStats);

// Gestion Admin de la fidélité (Dashboard Pro)
router.get('/api/admin/loyalty/settings', adminController.getLoyaltySettings);
router.post('/api/admin/loyalty/settings', adminController.updateLoyaltySettings);

// --- NOTIFICATIONS ---
router.get('/api/notifications/unread', matchController.getUnreadNotifications);
router.post('/api/notifications/mark-read', matchController.markNotificationRead);

// --- MATCHS DATA ---
router.get('/api/reservations', matchController.getReservations);
router.get('/api/reservations/check', matchController.checkAvailability);
router.get('/api/matches/public', matchController.getMercato);
router.get('/api/match/lookup/:code', matchController.lookupMatch);
router.get('/api/match/:id', matchController.getMatchDetails);
router.get('/api/payment/details', matchController.getPaymentDetails);

// --- ACTIONS MATCH & BOOKING ---
router.post('/book', matchController.book);
router.post('/api/match/join-pay', matchController.joinPay);
router.post('/api/match/create-and-pay', matchController.createAndPay);
router.post('/api/payment/confirm', matchController.confirmPayment);
router.post('/api/matches/join-by-code', matchController.joinByCode);
router.post('/api/match/leave', matchController.leaveMatch);
router.post('/api/match/kick', matchController.kickPlayer);
router.post('/api/match/toggle-public', matchController.togglePublic);
router.post('/api/match/change-side', matchController.changeSide);
router.post('/api/match/update-score', matchController.updateScore);
router.post('/api/match/teams', matchController.updateTeams);
router.post('/api/match/update-score-full', matchController.updateScoreFull);
router.post('/api/match/vote', matchController.submitVote);
router.post('/api/match/update-names', matchController.updateTeamNames);
router.post('/api/match/move-player', matchController.movePlayer);
router.get('/match-roles', matchController.getPublicVoteRoles);
router.get('/api/match-roles', matchController.getPublicVoteRoles);

// --- SOCIAL MATCH ---
router.post('/api/match/invite-friend', matchController.inviteFriend);
router.post('/api/match/invite-friend-v2', matchController.inviteFriendV2);
router.post('/api/match/invitation/respond', matchController.invitationRespond);
router.get('/api/match/invitations/pending', matchController.getPendingInvitations);
router.get('/api/match/:id/votes', matchController.getVoteResults);

// --- CHAT ---
router.get('/api/match/:id/chat', matchController.getChat);
router.post('/api/match/:id/chat', matchController.postChat);


module.exports = router;