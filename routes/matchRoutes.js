const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');
const mainController = require('../controllers/mainController');
const { isAuthenticated } = require('../middlewares/auth');

// --- PUBLIC ---
router.get('/api/settings', mainController.getSettings);
router.post('/api/settings', mainController.updateSettings);
router.get('/api/complexes', mainController.getComplexes);
router.get('/api/complexes/:id/terrains', mainController.getComplexTerrains);
router.get('/api/pricing-rules/:complexId', mainController.getPricingRulesPublic);

// --- AUTH ---
router.use(isAuthenticated); 

// Notifications
router.get('/api/notifications/unread', matchController.getUnreadNotifications);
router.post('/api/notifications/mark-read', matchController.markNotificationRead);

// Matchs Data
router.get('/api/reservations', matchController.getReservations);
router.get('/api/reservations/check', matchController.checkAvailability);
router.get('/api/matches/public', matchController.getMercato);
router.get('/api/match/lookup/:code', matchController.lookupMatch);
router.get('/api/match/:id', matchController.getMatchDetails);
router.get('/api/payment/details', matchController.getPaymentDetails);

// Actions Match & Booking
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
// Renommer les équipes
router.post('/api/match/update-names', matchController.updateTeamNames);
// Déplacer un joueur (Capitaine uniquement)
router.post('/api/match/move-player', matchController.movePlayer);

// Social Match
router.post('/api/match/invite-friend', matchController.inviteFriend);
router.post('/api/match/invite-friend-v2', matchController.inviteFriendV2);
router.post('/api/match/invitation/respond', matchController.invitationRespond);
router.get('/api/match/invitations/pending', matchController.getPendingInvitations);

// Chat
router.get('/api/match/:id/chat', matchController.getChat);
router.post('/api/match/:id/chat', matchController.postChat);

router.use(isAuthenticated);
router.post('/book', matchController.book);


module.exports = router;
