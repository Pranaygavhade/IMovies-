const Movie = require('../models/Movie');
const Show = require('../models/Show');
const Theatre = require('../models/Theatre');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Get all movies with filters, search, pagination and sorting
// @route   GET /api/v1/movies
// @access  Public
exports.getMovies = async (req, res, next) => {
  try {
    const {
      search,
      genre,
      language,
      status,
      city,
      theatre,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    const query = {};

    // Status filter (default to 'now_showing' if requested, or return all)
    if (status) {
      query.status = status;
    }

    // Genre filter
    if (genre && genre !== 'All') {
      query.genre = { $in: [genre] };
    }

    // Language filter
    if (language && language !== 'All') {
      query.language = new RegExp(`^${language}$`, 'i');
    }

    // Text search on title, director, genre, language
    if (search && search.trim() !== '') {
      query.$or = [
        { title: { $regex: search.trim(), $options: 'i' } },
        { director: { $regex: search.trim(), $options: 'i' } },
        { genre: { $regex: search.trim(), $options: 'i' } },
        { language: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // City or Theatre filter: find movie IDs that have active shows in that city / theatre
    if (city || theatre) {
      const theatreQuery = {};
      if (city) theatreQuery.city = new RegExp(`^${city}$`, 'i');
      if (theatre) theatreQuery._id = theatre;

      const matchingTheatres = await Theatre.find(theatreQuery).select('_id');
      const theatreIds = matchingTheatres.map((t) => t._id);

      const shows = await Show.find({
        theatre: { $in: theatreIds },
        status: 'active',
      }).distinct('movie');

      query._id = { $in: shows };
    }

    // Sorting
    let sortQuery = { releaseDate: -1 };
    if (sort === 'rating_desc') {
      sortQuery = { rating: -1 };
    } else if (sort === 'rating_asc') {
      sortQuery = { rating: 1 };
    } else if (sort === 'release_asc') {
      sortQuery = { releaseDate: 1 };
    } else if (sort === 'title_asc') {
      sortQuery = { title: 1 };
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const [movies, total] = await Promise.all([
      Movie.find(query).sort(sortQuery).skip(skip).limit(limitNum).lean(),
      Movie.countDocuments(query),
    ]);

    return sendSuccess(
      res,
      {
        movies,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
      'Movies retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get single movie by ID with show dates
// @route   GET /api/v1/movies/:id
// @access  Public
exports.getMovieById = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return sendError(res, 'Movie not found', 404);
    }

    // Get upcoming show dates and available theatres for this movie
    const shows = await Show.find({ movie: movie._id, status: 'active' })
      .populate('theatre', 'name city address')
      .sort({ date: 1, startTime: 1 })
      .lean();

    // Distinct dates
    const availableDates = [...new Set(shows.map((s) => s.date))].sort();

    return sendSuccess(
      res,
      {
        movie,
        availableDates,
        shows,
      },
      'Movie details retrieved'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new movie (Admin)
// @route   POST /api/v1/movies
// @access  Private/Admin
exports.createMovie = async (req, res, next) => {
  try {
    const movieData = { ...req.body };

    // Format genre if sent as comma-separated string
    if (typeof movieData.genre === 'string') {
      movieData.genre = movieData.genre.split(',').map((g) => g.trim());
    }

    // Format cast if sent as comma-separated string
    if (typeof movieData.cast === 'string') {
      movieData.cast = movieData.cast.split(',').map((c) => c.trim());
    }

    // If poster file uploaded via multer
    if (req.files && req.files.poster) {
      movieData.poster = `/uploads/${req.files.poster[0].filename}`;
    }

    // If backdrop file uploaded via multer
    if (req.files && req.files.backdrop) {
      movieData.backdrop = `/uploads/${req.files.backdrop[0].filename}`;
    }

    const movie = await Movie.create(movieData);

    return sendSuccess(res, { movie }, 'Movie created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update movie (Admin)
// @route   PUT /api/v1/movies/:id
// @access  Private/Admin
exports.updateMovie = async (req, res, next) => {
  try {
    const movieData = { ...req.body };

    if (typeof movieData.genre === 'string') {
      movieData.genre = movieData.genre.split(',').map((g) => g.trim());
    }

    if (typeof movieData.cast === 'string') {
      movieData.cast = movieData.cast.split(',').map((c) => c.trim());
    }

    if (req.files && req.files.poster) {
      movieData.poster = `/uploads/${req.files.poster[0].filename}`;
    }

    if (req.files && req.files.backdrop) {
      movieData.backdrop = `/uploads/${req.files.backdrop[0].filename}`;
    }

    const movie = await Movie.findByIdAndUpdate(req.params.id, movieData, {
      new: true,
      runValidators: true,
    });

    if (!movie) {
      return sendError(res, 'Movie not found', 404);
    }

    return sendSuccess(res, { movie }, 'Movie updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete movie (Admin)
// @route   DELETE /api/v1/movies/:id
// @access  Private/Admin
exports.deleteMovie = async (req, res, next) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return sendError(res, 'Movie not found', 404);
    }

    await Movie.findByIdAndDelete(req.params.id);
    // Also cancel any associated upcoming shows
    await Show.updateMany({ movie: req.params.id }, { $set: { status: 'cancelled' } });

    return sendSuccess(res, {}, 'Movie deleted successfully');
  } catch (error) {
    next(error);
  }
};
