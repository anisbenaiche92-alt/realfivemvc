// playerRoutes.js CORRIGÉ
const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');
const { isAuthenticated } = require('../middlewares/auth');

router.use(isAuthenticated); // ✅ Protection globale

// Recherche (MANQUANTE dans le nouveau système !)
router.get('/api/users/search', playerController.searchPlayers);

// Amis
router.get('/api/friends', playerController.getFriends);
router.post('/api/friends/add', playerController.addFriend);
router.post('/api/friends/add-by-code', playerController.addFriendByCode);
router.post('/api/friends/remove', playerController.removeFriend);

// Demandes d'amis
router.post('/api/friends/request', playerController.sendFriendRequest);
router.post('/api/friends/respond', playerController.respondFriendRequest);
router.get('/api/friends/requests', playerController.getFriendRequests);

// Stats
router.get('/api/stats/user/:id', playerController.getUserStats);


//code promo
router.post('/api/payment/verify-promo', playerController.verifyPromo);

module.exports = router;