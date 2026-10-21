const express = require('express');
const router = express.Router();
const {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} = require('../controllers/movieController');
const { protectRoute, authorizeRoles } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', getMovies);
router.get('/:id', getMovieById);

router.post(
  '/',
  protectRoute,
  authorizeRoles('admin'),
  upload.fields([
    { name: 'poster', maxCount: 1 },
    { name: 'backdrop', maxCount: 1 },
  ]),
  createMovie
);

router.put(
  '/:id',
  protectRoute,
  authorizeRoles('admin'),
  upload.fields([
    { name: 'poster', maxCount: 1 },
    { name: 'backdrop', maxCount: 1 },
  ]),
  updateMovie
);

router.delete('/:id', protectRoute, authorizeRoles('admin'), deleteMovie);

module.exports = router;
