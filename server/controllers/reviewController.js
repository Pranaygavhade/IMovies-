const Review = require('../models/Review');
const Movie = require('../models/Movie');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Get reviews for a movie
// @route   GET /api/v1/reviews/movie/:movieId
// @access  Public
exports.getReviewsByMovie = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const query = {
      movie: movieId,
      isApproved: true,
    };

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(query),
    ]);

    return sendSuccess(
      res,
      {
        reviews,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
      'Reviews retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update own review for a movie
// @route   POST /api/v1/reviews or POST /api/v1/reviews/:movieId
// @access  Private
exports.createOrUpdateReview = async (req, res, next) => {
  try {
    const targetMovieId = req.params.movieId || req.body.movieId || req.body.movie;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    if (!targetMovieId || !rating || !comment) {
      return sendError(res, 'Movie ID, rating (1-5), and review comment are required', 400);
    }

    const movie = await Movie.findById(targetMovieId);
    if (!movie) {
      return sendError(res, 'Movie not found', 404);
    }

    let review = await Review.findOne({ user: userId, movie: targetMovieId });

    if (review) {
      // Update existing review
      review.rating = Number(rating);
      review.comment = comment;
      await review.save();
      await Review.recalculateMovieRating(targetMovieId);

      return sendSuccess(res, { review }, 'Review updated successfully');
    }

    // Create new review
    review = await Review.create({
      user: userId,
      movie: targetMovieId,
      rating: Number(rating),
      comment,
      isApproved: true,
    });

    await Review.recalculateMovieRating(targetMovieId);

    return sendSuccess(res, { review }, 'Review posted successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete own review
// @route   DELETE /api/v1/reviews/:id
// @access  Private
exports.deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return sendError(res, 'Review not found', 404);
    }

    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return sendError(res, 'Not authorized to delete this review', 403);
    }

    const movieId = review.movie;
    await Review.findByIdAndDelete(req.params.id);
    await Review.recalculateMovieRating(movieId);

    return sendSuccess(res, {}, 'Review deleted successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: get all reviews for moderation
// @route   GET /api/v1/reviews/admin/all
// @access  Private/Admin
exports.getAllReviewsAdmin = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, isApproved } = req.query;
    const query = {};

    if (isApproved !== undefined) {
      query.isApproved = isApproved === 'true';
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('user', 'name email avatar')
        .populate('movie', 'title poster')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(query),
    ]);

    return sendSuccess(
      res,
      {
        reviews,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
      'All reviews retrieved for moderation'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: moderate review approval
// @route   PUT /api/v1/reviews/:id/approve
// @access  Private/Admin
exports.approveReview = async (req, res, next) => {
  try {
    const { isApproved } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: isApproved !== false },
      { new: true }
    );

    if (!review) {
      return sendError(res, 'Review not found', 404);
    }

    await Review.recalculateMovieRating(review.movie);

    return sendSuccess(res, { review }, `Review status updated to ${review.isApproved ? 'Approved' : 'Pending'}`);
  } catch (error) {
    next(error);
  }
};
