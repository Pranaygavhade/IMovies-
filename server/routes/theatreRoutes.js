const express = require('express');
const router = express.Router();
const {
  getTheatres,
  getCities,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
} = require('../controllers/theatreController');
const { protectRoute, authorizeRoles } = require('../middleware/auth');

router.get('/cities', getCities);
router.get('/', getTheatres);
router.get('/:id', getTheatreById);

router.post('/', protectRoute, authorizeRoles('admin'), createTheatre);
router.put('/:id', protectRoute, authorizeRoles('admin'), updateTheatre);
router.delete('/:id', protectRoute, authorizeRoles('admin'), deleteTheatre);

module.exports = router;
