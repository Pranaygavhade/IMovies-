const Movie = require('../models/Movie');
const Show = require('../models/Show');
const Theatre = require('../models/Theatre');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const Favorite = require('../models/Favorite');
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

    // Sorting options: Popular, Rating, Release Date, Title
    let sortQuery = { releaseDate: -1 };
    if (sort === 'trending' || sort === 'popularity_desc' || sort === 'popular') {
      sortQuery = { popularity: -1, releaseDate: -1 };
    } else if (sort === 'rating_desc' || sort === 'rating') {
      sortQuery = { rating: -1, averageRating: -1 };
    } else if (sort === 'rating_asc') {
      sortQuery = { rating: 1, averageRating: 1 };
    } else if (sort === 'release_asc') {
      sortQuery = { releaseDate: 1 };
    } else if (sort === 'release_desc' || sort === 'release_date') {
      sortQuery = { releaseDate: -1 };
    } else if (sort === 'title_asc') {
      sortQuery = { title: 1 };
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 12;
    const skip = (pageNum - 1) * limitNum;

    const [rawMovies, total] = await Promise.all([
      Movie.find(query).sort(sortQuery).skip(skip).limit(limitNum).lean(),
      Movie.countDocuments(query),
    ]);

    // Enrich movies with available cinema count, next 3 upcoming showtimes, and theatre amenities
    const movieIds = rawMovies.map((m) => m._id);
    let theatreFilter = {};
    if (city && city !== 'All') {
      const cityTheatres = await Theatre.find({ city: new RegExp(`^${city}$`, 'i') }).select('_id');
      theatreFilter = { theatre: { $in: cityTheatres.map((t) => t._id) } };
    }

    const activeShows = await Show.find({
      movie: { $in: movieIds },
      status: 'active',
      ...theatreFilter,
    })
      .populate('theatre', 'name city amenities screens')
      .sort({ showDate: 1, showTime: 1 })
      .lean();

    const showsByMovie = {};
    for (const s of activeShows) {
      const mId = s.movie.toString();
      if (!showsByMovie[mId]) showsByMovie[mId] = [];
      showsByMovie[mId].push(s);
    }

    const enrichedMovies = rawMovies.map((m) => {
      const mShows = showsByMovie[m._id.toString()] || [];
      const distinctTheatres = new Set(mShows.map((s) => s.theatre?._id?.toString() || s.theatre?.toString()));

      // Next up to 3 upcoming shows
      const upcomingShows = mShows
        .filter((s) => !isShowPast(s.showDate || s.date, s.showTime || s.startTime))
        .slice(0, 3)
        .map((s) => ({
          showId: s._id,
          showDate: s.showDate,
          showTime: s.showTime,
          format: s.format,
          theatreName: s.theatre?.name || '',
          theatreCity: s.theatre?.city || '',
          price: s.priceMap?.middle || s.priceMap?.lower || 150,
        }));

      // Collect distinct amenities
      const amenitiesSet = new Set();
      mShows.forEach((s) => {
        if (s.theatre?.amenities && Array.isArray(s.theatre.amenities)) {
          s.theatre.amenities.forEach((a) => amenitiesSet.add(a));
        }
        if (s.format && s.format !== '2D') {
          amenitiesSet.add(s.format);
        }
      });

      return {
        ...m,
        cinemasCount: distinctTheatres.size,
        nextShows: upcomingShows,
        theatreAmenities: Array.from(amenitiesSet),
      };
    });

    return sendSuccess(
      res,
      {
        movies: enrichedMovies,
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

// @desc    Get trending movies ranked by real bookings in last 7 days + watchlist adds + TMDB popularity
// @route   GET /api/v1/movies/trending
// @access  Public
exports.getTrendingMovies = async (req, res, next) => {
  try {
    const { city, limit = 10 } = req.query;

    let theatreFilter = {};
    if (city && city !== 'All') {
      const cityTheatres = await Theatre.find({ city: new RegExp(`^${city}$`, 'i') }).select('_id');
      theatreFilter = { theatre: { $in: cityTheatres.map((t) => t._id) } };
    }

    // 1. Fetch now_showing movies
    const movies = await Movie.find({ status: 'now_showing' }).lean();

    // 2. Aggregate confirmed bookings from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentBookings = await Booking.find({
      status: 'confirmed',
      createdAt: { $gte: sevenDaysAgo },
    })
      .populate('show', 'movie')
      .select('show')
      .lean();

    const bookingCounts = {};
    for (const b of recentBookings) {
      const mId = b.show?.movie?.toString();
      if (mId) {
        bookingCounts[mId] = (bookingCounts[mId] || 0) + 1;
      }
    }

    // 3. Aggregate watchlist additions
    const favorites = await Favorite.find({}).select('movie').lean();
    const favoriteCounts = {};
    for (const f of favorites) {
      const mId = f.movie?.toString();
      if (mId) {
        favoriteCounts[mId] = (favoriteCounts[mId] || 0) + 1;
      }
    }

    // 4. Calculate weighted score: (bookings * 10) + (watchlist * 3) + popularity
    const rankedMovies = movies.map((m) => {
      const mId = m._id.toString();
      const bookingsCount = bookingCounts[mId] || 0;
      const watchlistCount = favoriteCounts[mId] || 0;
      const popularityScore = m.popularity || 50;

      const trendingScore = bookingsCount * 10 + watchlistCount * 3 + popularityScore;
      return {
        ...m,
        trendingMetrics: {
          recentBookings: bookingsCount,
          watchlistAdds: watchlistCount,
          popularity: popularityScore,
        },
        trendingScore,
      };
    });

    rankedMovies.sort((a, b) => b.trendingScore - a.trendingScore);

    const topTrending = rankedMovies.slice(0, parseInt(limit, 10));

    return sendSuccess(
      res,
      {
        movies: topTrending,
        rankingBasis: 'Ranked by bookings in last 7 days, watchlist adds & TMDB popularity',
      },
      'Trending movies retrieved'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Live search suggestions for movies, cinemas, and genres as user types
// @route   GET /api/v1/movies/suggestions?q=
// @access  Public
exports.getSearchSuggestions = async (req, res, next) => {
  try {
    const { q, city } = req.query;

    if (!q || q.trim() === '') {
      return sendSuccess(res, { movies: [], cinemas: [], genres: [] }, 'Empty query');
    }

    const cleanQ = q.trim();
    const regex = new RegExp(cleanQ, 'i');

    // 1. Match Movies
    const movies = await Movie.find({
      $or: [{ title: regex }, { director: regex }],
      status: { $in: ['now_showing', 'upcoming'] },
    })
      .select('title poster certification runtime releaseDate averageRating genres')
      .limit(5)
      .lean();

    // 2. Match Cinemas / Theatres
    const theatreQuery = { name: regex };
    if (city && city !== 'All') {
      theatreQuery.city = new RegExp(`^${city}$`, 'i');
    }
    const cinemas = await Theatre.find(theatreQuery)
      .select('name city address amenities')
      .limit(5)
      .lean();

    // 3. Match Genres
    const ALL_GENRES = [
      'Action',
      'Adventure',
      'Animation',
      'Biography',
      'Comedy',
      'Crime',
      'Drama',
      'Family',
      'Fantasy',
      'History',
      'Horror',
      'Music',
      'Mystery',
      'Romance',
      'Sci-Fi',
      'Thriller',
    ];
    const matchingGenres = ALL_GENRES.filter((g) => g.toLowerCase().includes(cleanQ.toLowerCase())).slice(0, 5);

    return sendSuccess(
      res,
      {
        movies,
        cinemas,
        genres: matchingGenres,
      },
      'Search suggestions retrieved'
    );
  } catch (error) {
    next(error);
  }
};
