const express = require('express');
const router = express.Router();
const {
  getReviewsByMovie,
  createOrUpdateReview,
  deleteReview,
  getAllReviewsAdmin,
  approveReview,
} = require('../controllers/reviewController');
const { protectRoute, authorizeRoles } = require('../middleware/auth');
const { validate, reviewValidation } = require('../middleware/validator');

router.get('/movie/:movieId', getReviewsByMovie);
router.post('/', protectRoute, createOrUpdateReview);
router.post('/:movieId', protectRoute, createOrUpdateReview);
router.delete('/:id', protectRoute, deleteReview);

// Admin moderation
router.get('/admin/all', protectRoute, authorizeRoles('admin'), getAllReviewsAdmin);
router.put('/:id/approve', protectRoute, authorizeRoles('admin'), approveReview);

module.exports = router;
