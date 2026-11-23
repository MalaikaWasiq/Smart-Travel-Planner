const express = require('express');
const { requireAuth, optionalAuth } = require('../middleware/authMiddleware');
const {
  listDestinations,
  getDestination,
  toggleFavoriteDestination,
  listFavorites,
  searchMapDestinations,
} = require('../controllers/destinationController');

const { getMenuForDestination } = require('../services/foodService');

const router = express.Router();

router.get('/search-map', optionalAuth, searchMapDestinations);
router.get('/:city/food-menu', optionalAuth, (req, res) => {
  const menu = getMenuForDestination(req.params.city);
  res.json({ ok: true, menu });
});
router.get('/', optionalAuth, listDestinations);
router.get('/favorites', requireAuth, listFavorites);
router.get('/:id', optionalAuth, getDestination);
router.post('/:id/favorite', requireAuth, toggleFavoriteDestination);

module.exports = router;
