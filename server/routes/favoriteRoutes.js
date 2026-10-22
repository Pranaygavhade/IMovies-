const express = require('express');
const router = express.Router();
const {
  getMyFavorites,
  addFavorite,
  removeFavorite,
  checkIsFavorite,
} = require('../controllers/favoriteController');
const { protectRoute } = require('../middleware/auth');

router.get('/', protectRoute, getMyFavorites);
router.get('/check/:movieId', protectRoute, checkIsFavorite);
router.post('/:movieId', protectRoute, addFavorite);
router.delete('/:movieId', protectRoute, removeFavorite);

module.exports = router;
