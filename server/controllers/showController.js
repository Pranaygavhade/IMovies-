const Show = require('../models/Show');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Seat = require('../models/Seat');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Get shows with filtering by movie, city, date, theatre
// @route   GET /api/v1/shows
// @access  Public
exports.getShows = async (req, res, next) => {
  try {
    const { movie, city, date, theatre } = req.query;
    const query = { status: 'active' };

    if (movie) query.movie = movie;
    if (date) query.date = date;
    if (theatre) query.theatre = theatre;

    if (city && city !== 'All') {
      const theatresInCity = await Theatre.find({
        city: new RegExp(`^${city}$`, 'i'),
      }).select('_id');
      query.theatre = { $in: theatresInCity.map((t) => t._id) };
    }

    const shows = await Show.find(query)
      .populate('movie', 'title poster certificate duration language genre rating')
      .populate('theatre', 'name city address amenities')
      .sort({ date: 1, startTime: 1 })
      .lean();

    return sendSuccess(res, { shows }, 'Shows retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single show by ID with real-time seat map
// @route   GET /api/v1/shows/:id
// @access  Public
exports.getShowById = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate('movie', 'title poster certificate duration language genre rating backdrop')
      .populate('theatre', 'name city address screens amenities');

    if (!show) {
      return sendError(res, 'Show not found', 404);
    }

    // Check for expired locks and auto-release them in this show
    const now = new Date();
    await Seat.updateMany(
      {
        show: show._id,
        status: 'locked',
        lockExpiresAt: { $lt: now },
      },
      {
        $set: {
          status: 'available',
          lockedBy: null,
          lockExpiresAt: null,
        },
      }
    );

    // Fetch all seats for this show
    const seats = await Seat.find({ show: show._id }).sort({ row: 1, seatNumber: 1 }).lean();

    return sendSuccess(
      res,
      {
        show,
        seats,
      },
      'Show details with seat layout retrieved'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Create new show (Admin, with overlap check & seat generation)
// @route   POST /api/v1/shows
// @access  Private/Admin
exports.createShow = async (req, res, next) => {
  try {
    const { movie, theatre, screen, date, startTime, endTime, language, format, priceMap } = req.body;

    const theatreDoc = await Theatre.findById(theatre);
    if (!theatreDoc) {
      return sendError(res, 'Theatre not found', 404);
    }

    const movieDoc = await Movie.findById(movie);
    if (!movieDoc) {
      return sendError(res, 'Movie not found', 404);
    }

    // Check for showtime overlaps on the same screen, theatre, and date
    const overlappingShow = await Show.findOne({
      theatre,
      screen,
      date,
      status: 'active',
      $or: [
        { startTime: { $lte: startTime }, endTime: { $gte: startTime } },
        { startTime: { $lte: endTime }, endTime: { $gte: endTime } },
        { startTime: { $gte: startTime }, endTime: { $lte: endTime } },
      ],
    });

    if (overlappingShow) {
      return sendError(
        res,
        `Schedule conflict: Screen '${screen}' already has a show scheduled between ${overlappingShow.startTime} and ${overlappingShow.endTime}`,
        400
      );
    }

    // Create show
    const show = await Show.create({
      movie,
      theatre,
      screen,
      date,
      startTime,
      endTime,
      language: language || movieDoc.language,
      format: format || '2D',
      priceMap: priceMap || {
        Regular: 220,
        Premium: 350,
        Recliner: 500,
      },
      status: 'active',
    });

    // Generate seats based on screen layout
    const screenConfig = theatreDoc.screens.find((s) => s.name === screen) || theatreDoc.screens[0];
    const seatDocs = [];

    if (screenConfig && screenConfig.seatLayout && screenConfig.seatLayout.length > 0) {
      for (const rowConfig of screenConfig.seatLayout) {
        const row = rowConfig.row;
        const count = rowConfig.seats || 10;
        const category = rowConfig.category || 'Regular';
        const price = (priceMap && priceMap[category]) || rowConfig.basePrice || 220;

        for (let i = 1; i <= count; i++) {
          seatDocs.push({
            show: show._id,
            seatNumber: `${row}${i}`,
            row,
            category,
            price,
            status: 'available',
            lockedBy: null,
            lockExpiresAt: null,
            bookingId: null,
          });
        }
      }
    } else {
      // Default fallback layout (Rows A to G, 10 seats each)
      const rows = [
        { row: 'A', category: 'Recliner', price: priceMap?.Recliner || 500 },
        { row: 'B', category: 'Recliner', price: priceMap?.Recliner || 500 },
        { row: 'C', category: 'Premium', price: priceMap?.Premium || 350 },
        { row: 'D', category: 'Premium', price: priceMap?.Premium || 350 },
        { row: 'E', category: 'Regular', price: priceMap?.Regular || 220 },
        { row: 'F', category: 'Regular', price: priceMap?.Regular || 220 },
      ];
      for (const r of rows) {
        for (let i = 1; i <= 10; i++) {
          seatDocs.push({
            show: show._id,
            seatNumber: `${r.row}${i}`,
            row: r.row,
            category: r.category,
            price: r.price,
            status: 'available',
          });
        }
      }
    }

    await Seat.insertMany(seatDocs);

    return sendSuccess(res, { show, seatsCreated: seatDocs.length }, 'Show and seat map created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update show (Admin)
// @route   PUT /api/v1/shows/:id
// @access  Private/Admin
exports.updateShow = async (req, res, next) => {
  try {
    const show = await Show.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!show) {
      return sendError(res, 'Show not found', 404);
    }

    return sendSuccess(res, { show }, 'Show updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete show (Admin)
// @route   DELETE /api/v1/shows/:id
// @access  Private/Admin
exports.deleteShow = async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id);
    if (!show) {
      return sendError(res, 'Show not found', 404);
    }

    await Show.findByIdAndDelete(req.params.id);
    await Seat.deleteMany({ show: req.params.id });

    return sendSuccess(res, {}, 'Show and associated seats deleted');
  } catch (error) {
    next(error);
  }
};
