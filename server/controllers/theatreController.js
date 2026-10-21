const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Get all theatres with optional city filter
// @route   GET /api/v1/theatres
// @access  Public
exports.getTheatres = async (req, res, next) => {
  try {
    const { city } = req.query;
    const query = {};

    if (city && city !== 'All') {
      query.city = new RegExp(`^${city}$`, 'i');
    }

    const theatres = await Theatre.find(query).sort({ city: 1, name: 1 }).lean();

    return sendSuccess(res, { theatres }, 'Theatres retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get list of all distinct cities with active theatres
// @route   GET /api/v1/theatres/cities
// @access  Public
exports.getCities = async (req, res, next) => {
  try {
    const cities = await Theatre.distinct('city');
    return sendSuccess(res, { cities: cities.sort() }, 'Cities retrieved successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Get single theatre details
// @route   GET /api/v1/theatres/:id
// @access  Public
exports.getTheatreById = async (req, res, next) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) {
      return sendError(res, 'Theatre not found', 404);
    }

    // Find active shows in this theatre
    const shows = await Show.find({ theatre: theatre._id, status: 'active' })
      .populate('movie', 'title poster certificate duration language')
      .sort({ date: 1, startTime: 1 })
      .lean();

    return sendSuccess(res, { theatre, shows }, 'Theatre details retrieved');
  } catch (error) {
    next(error);
  }
};

// @desc    Create new theatre (Admin)
// @route   POST /api/v1/theatres
// @access  Private/Admin
exports.createTheatre = async (req, res, next) => {
  try {
    const theatre = await Theatre.create(req.body);
    return sendSuccess(res, { theatre }, 'Theatre created successfully', 201);
  } catch (error) {
    next(error);
  }
};

// @desc    Update theatre (Admin)
// @route   PUT /api/v1/theatres/:id
// @access  Private/Admin
exports.updateTheatre = async (req, res, next) => {
  try {
    const theatre = await Theatre.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!theatre) {
      return sendError(res, 'Theatre not found', 404);
    }

    return sendSuccess(res, { theatre }, 'Theatre updated successfully');
  } catch (error) {
    next(error);
  }
};

// @desc    Delete theatre (Admin)
// @route   DELETE /api/v1/theatres/:id
// @access  Private/Admin
exports.deleteTheatre = async (req, res, next) => {
  try {
    const theatre = await Theatre.findById(req.params.id);
    if (!theatre) {
      return sendError(res, 'Theatre not found', 404);
    }

    await Theatre.findByIdAndDelete(req.params.id);
    await Show.updateMany({ theatre: req.params.id }, { $set: { status: 'cancelled' } });

    return sendSuccess(res, {}, 'Theatre deleted successfully');
  } catch (error) {
    next(error);
  }
};
