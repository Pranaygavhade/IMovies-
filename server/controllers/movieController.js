const Movie = require('../models/Movie');
const Show = require('../models/Show');
const Theatre = require('../models/Theatre');
const Seat = require('../models/Seat');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { isShowPast } = require('../utils/dateUtils');

// @desc    Get all movies with search, filter, and pagination
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

    // Do not show archived movies to public
    if (status && status !== 'all') {
      query.status = status;
    } else {
      query.status = { $in: ['now_showing', 'upcoming'] };
    }

    // Genre filter
    if (genre && genre !== 'All') {
      query.$or = [{ genres: { $in: [genre] } }, { genre: { $in: [genre] } }];
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
        { genres: { $regex: search.trim(), $options: 'i' } },
        { language: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    // City or Theatre filter: find movie IDs that have active shows in that city / theatre
    if (city || theatre) {
      const theatreQuery = {};
      if (city && city !== 'All') theatreQuery.city = new RegExp(`^${city}$`, 'i');
      if (theatre) theatreQuery._id = theatre;

      const matchingTheatres = await Theatre.find(theatreQuery).select('_id');
      const theatreIds = matchingTheatres.map((t) => t._id);

      const activeMovieIds = await Show.find({
        theatre: { $in: theatreIds },
        status: 'active',
      }).distinct('movie');

      if (status === 'upcoming') {
        // Keep upcoming movies visible regardless of shows
      } else if (status === 'all') {
        query.$or = [
          { _id: { $in: activeMovieIds }, status: 'now_showing' },
          { status: 'upcoming' },
        ];
      } else {
        query._id = { $in: activeMovieIds };
      }
    }

    // Sorting
    let sortQuery = { releaseDate: -1 };
    if (sort === 'trending' || sort === 'popularity_desc') {
      sortQuery = { popularity: -1, releaseDate: -1 };
    } else if (sort === 'rating_desc') {
      sortQuery = { rating: -1, averageRating: -1 };
    } else if (sort === 'rating_asc') {
      sortQuery = { rating: 1, averageRating: 1 };
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

// @desc    Get single movie by ID with show dates & city-filtered shows
// @route   GET /api/v1/movies/:id
// @access  Public
exports.getMovieById = async (req, res, next) => {
  try {
    const { city } = req.query;
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return sendError(res, 'Movie not found', 404);
    }

    const showQuery = { movie: movie._id, status: 'active' };

    if (city && city !== 'All') {
      const theatresInCity = await Theatre.find({
        city: new RegExp(`^${city}$`, 'i'),
      }).select('_id');
      showQuery.theatre = { $in: theatresInCity.map((t) => t._id) };
    }

    const shows = await Show.find(showQuery)
      .populate('theatre', 'name city address location screens amenities lowerSeatPrice middleSeatPrice balconySeatPrice')
      .sort({ showDate: 1, showTime: 1 })
      .lean();

    // Attach isPast and occupancy metrics
    const enrichedShows = [];
    for (const s of shows) {
      const sDate = s.showDate || s.date;
      const sTime = s.showTime || s.startTime;
      const isPast = isShowPast(sDate, sTime);

      const totalSeats = await Seat.countDocuments({ show: s._id });
      const bookedSeats = await Seat.countDocuments({ show: s._id, status: 'booked' });
      const occupancyPercent = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0;

      let occupancyStatus = 'available';
      if (occupancyPercent >= 90) occupancyStatus = 'almost_full';
      else if (occupancyPercent >= 70) occupancyStatus = 'fast_filling';

      enrichedShows.push({
        ...s,
        isPast,
        totalSeats,
        bookedSeats,
        occupancyPercent,
        occupancyStatus,
      });
    }

    // Distinct dates
    const availableDates = [...new Set(enrichedShows.map((s) => s.showDate || s.date))].sort();

    return sendSuccess(
      res,
      {
        movie,
        availableDates,
        shows: enrichedShows,
      },
      'Movie retrieved with showtimes'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Create new movie (Admin)
// @route   POST /api/v1/movies
// @access  Private/Admin
exports.createMovie = async (req, res, next) => {
  try {
    let poster = req.body.poster;
    let backdrop = req.body.backdrop;

    if (req.files) {
      if (req.files.poster && req.files.poster[0]) {
        poster = `/uploads/${req.files.poster[0].filename}`;
      }
      if (req.files.backdrop && req.files.backdrop[0]) {
        backdrop = `/uploads/${req.files.backdrop[0].filename}`;
      }
    }

    let genres = req.body.genres || req.body.genre;
    if (typeof genres === 'string') {
      try {
        genres = JSON.parse(genres);
      } catch (e) {
        genres = genres.split(',').map((g) => g.trim());
      }
    }

    let cast = req.body.cast;
    if (typeof cast === 'string') {
      try {
        cast = JSON.parse(cast);
      } catch (e) {
        cast = cast.split(',').map((c) => c.trim());
      }
    }

    const movie = await Movie.create({
      title: req.body.title,
      description: req.body.description,
      genres,
      language: req.body.language,
      runtime: req.body.runtime || req.body.duration,
      certification: req.body.certification || req.body.certificate || 'UA',
      releaseDate: req.body.releaseDate,
      poster,
      backdrop,
      trailerUrl: req.body.trailerUrl,
      cast,
      director: req.body.director,
      status: req.body.status || 'now_showing',
      averageRating: req.body.rating || req.body.averageRating || 0,
      popularity: req.body.popularity || 75,
      isCustom: true, // Manual admin create marked as custom
    });

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
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return sendError(res, 'Movie not found', 404);
    }

    const updateData = { ...req.body, isCustom: true };

    if (req.files) {
      if (req.files.poster && req.files.poster[0]) {
        updateData.poster = `/uploads/${req.files.poster[0].filename}`;
      }
      if (req.files.backdrop && req.files.backdrop[0]) {
        updateData.backdrop = `/uploads/${req.files.backdrop[0].filename}`;
      }
    }

    if (updateData.genres || updateData.genre) {
      let genres = updateData.genres || updateData.genre;
      if (typeof genres === 'string') {
        try {
          genres = JSON.parse(genres);
        } catch (e) {
          genres = genres.split(',').map((g) => g.trim());
        }
      }
      updateData.genres = genres;
    }

    const updatedMovie = await Movie.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    return sendSuccess(res, { movie: updatedMovie }, 'Movie updated successfully');
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

    await Show.updateMany({ movie: movie._id }, { status: 'cancelled' });
    await Movie.findByIdAndDelete(req.params.id);

    return sendSuccess(res, null, 'Movie and associated shows cancelled successfully');
  } catch (error) {
    next(error);
  }
};
