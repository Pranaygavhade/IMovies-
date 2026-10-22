const Favorite = require('../models/Favorite');
const Movie = require('../models/Movie');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Get user's favorites (Watchlist)
// @route   GET /api/v1/favorites
// @access  Private
exports.getMyFavorites = async (req, res, next) => {
  try {
    const favorites = await Favorite.find({ user: req.user.id })
      .populate('movie')
      .sort({ createdAt: -1 })
      .lean();

    const movies = favorites.filter((f) => f.movie !== null).map((f) => f.movie);

    return sendSuccess(res, { favorites: movies, total: movies.length }, 'Watchlist retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Add movie to favorites
// @route   POST /api/v1/favorites/:movieId
// @access  Private
exports.addFavorite = async (req, res, next) => {
  try {
    const { movieId } = req.params;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return sendError(res, 'Movie not found', 404);
    }

    const existing = await Favorite.findOne({ user: req.user.id, movie: movieId });
    if (existing) {
      return sendSuccess(res, { isFavorite: true }, 'Movie is already in your watchlist');
    }

    await Favorite.create({
      user: req.user.id,
      movie: movieId,
    });

    return sendSuccess(res, { isFavorite: true }, 'Movie added to watchlist', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Remove movie from favorites
// @route   DELETE /api/v1/favorites/:movieId
// @access  Private
exports.removeFavorite = async (req, res, next) => {
  try {
    const { movieId } = req.params;

    await Favorite.findOneAndDelete({ user: req.user.id, movie: movieId });

    return sendSuccess(res, { isFavorite: false }, 'Movie removed from watchlist');
  } catch (error) {
    next(error);
  }
};

// @desc    Check if movie is in user's favorites
// @route   GET /api/v1/favorites/check/:movieId
// @access  Private
exports.checkIsFavorite = async (req, res, next) => {
  try {
    const { movieId } = req.params;
    const existing = await Favorite.findOne({ user: req.user.id, movie: movieId });

    return sendSuccess(res, { isFavorite: Boolean(existing) }, 'Watchlist status retrieved');
  } catch (error) {
    next(error);
  }
};
