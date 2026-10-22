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
    const { movie, city, date, showDate, theatre } = req.query;
    const query = { status: 'active' };

    if (movie) query.movie = movie;
    const targetDate = showDate || date;
    if (targetDate) {
      query.$or = [{ showDate: targetDate }, { date: targetDate }];
    }
    if (theatre) query.theatre = theatre;

    if (city && city !== 'All') {
      const theatresInCity = await Theatre.find({
        city: new RegExp(`^${city}$`, 'i'),
      }).select('_id');
      query.theatre = { $in: theatresInCity.map((t) => t._id) };
    }

    const shows = await Show.find(query)
      .populate('movie', 'title poster certificate duration language genre rating averageRating')
      .populate('theatre', 'name city address amenities lowerSeatPrice middleSeatPrice balconySeatPrice')
      .sort({ showDate: 1, showTime: 1 })
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
      .populate('movie', 'title poster certificate duration runtime language genres genre rating averageRating backdrop')
      .populate('theatre', 'name city address screens amenities lowerSeatPrice middleSeatPrice balconySeatPrice');

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
    const {
      movie,
      theatre,
      screen,
      date,
      showDate,
      startTime,
      showTime,
      endTime,
      language,
      format,
      priceMap,
    } = req.body;

    const sDate = showDate || date;
    const sTime = showTime || startTime;

    if (!sDate || !sTime || !endTime || !movie || !theatre || !screen) {
      return sendError(res, 'Please provide all required show fields', 400);
    }

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
      $or: [{ showDate: sDate }, { date: sDate }],
      status: 'active',
      $and: [
        {
          $or: [
            { showTime: { $lte: sTime }, endTime: { $gte: sTime } },
            { showTime: { $lte: endTime }, endTime: { $gte: endTime } },
            { showTime: { $gte: sTime }, endTime: { $lte: endTime } },
          ],
        },
      ],
    });

    if (overlappingShow) {
      return sendError(
        res,
        `Schedule conflict: Screen '${screen}' already has a show scheduled (${overlappingShow.showTime || overlappingShow.startTime} - ${overlappingShow.endTime})`,
        400
      );
    }

    const calculatedPriceMap = {
      lower: priceMap?.lower || priceMap?.Regular || theatreDoc.lowerSeatPrice || 150,
      middle: priceMap?.middle || priceMap?.Premium || theatreDoc.middleSeatPrice || 250,
      balcony: priceMap?.balcony || priceMap?.Recliner || theatreDoc.balconySeatPrice || 400,
      Regular: priceMap?.lower || priceMap?.Regular || theatreDoc.lowerSeatPrice || 150,
      Premium: priceMap?.middle || priceMap?.Premium || theatreDoc.middleSeatPrice || 250,
      Recliner: priceMap?.balcony || priceMap?.Recliner || theatreDoc.balconySeatPrice || 400,
    };

    // Create show
    const show = await Show.create({
      movie,
      theatre,
      screen,
      showDate: sDate,
      showTime: sTime,
      endTime,
      language: language || movieDoc.language,
      format: format || '2D',
      priceMap: calculatedPriceMap,
      status: 'active',
    });

    // Generate seats based on screen layout
    const screenConfig = theatreDoc.screens.find((s) => s.name === screen) || theatreDoc.screens[0];
    const seatDocs = [];

    if (screenConfig && screenConfig.seatLayout && screenConfig.seatLayout.length > 0) {
      for (const rowConfig of screenConfig.seatLayout) {
        const row = rowConfig.row;
        const count = rowConfig.seats || 10;
        const tier = rowConfig.tier || (row === 'A' ? 'balcony' : row === 'F' ? 'lower' : 'middle');
        const category = rowConfig.category || (tier === 'balcony' ? 'Recliner' : tier === 'lower' ? 'Regular' : 'Premium');
        const price = calculatedPriceMap[tier] || calculatedPriceMap[category] || rowConfig.basePrice || 250;

        for (let i = 1; i <= count; i++) {
          seatDocs.push({
            show: show._id,
            seatNumber: `${row}${i}`,
            row,
            tier,
            category,
            price,
            status: 'available',
            lockedBy: null,
            lockExpiresAt: null,
            booking: null,
          });
        }
      }
    } else {
      // Default fallback layout (Rows A to F, 10 seats each)
      const rows = [
        { row: 'A', tier: 'balcony', category: 'Recliner', price: calculatedPriceMap.balcony },
        { row: 'B', tier: 'middle', category: 'Premium', price: calculatedPriceMap.middle },
        { row: 'C', tier: 'middle', category: 'Premium', price: calculatedPriceMap.middle },
        { row: 'D', tier: 'middle', category: 'Premium', price: calculatedPriceMap.middle },
        { row: 'E', tier: 'lower', category: 'Regular', price: calculatedPriceMap.lower },
        { row: 'F', tier: 'lower', category: 'Regular', price: calculatedPriceMap.lower },
      ];
      for (const r of rows) {
        for (let i = 1; i <= 10; i++) {
          seatDocs.push({
            show: show._id,
            seatNumber: `${r.row}${i}`,
            row: r.row,
            tier: r.tier,
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
    const updateData = { ...req.body };
    if (updateData.date) updateData.showDate = updateData.date;
    if (updateData.startTime) updateData.showTime = updateData.startTime;

    const show = await Show.findByIdAndUpdate(req.params.id, updateData, {
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
