const User = require('../models/User');
const Movie = require('../models/Movie');
const Theatre = require('../models/Theatre');
const Show = require('../models/Show');
const Seat = require('../models/Seat');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { sendSuccess, sendError } = require('../utils/apiResponse');

// @desc    Get comprehensive admin analytics and dashboard metrics
// @route   GET /api/v1/admin/stats
// @access  Private/Admin
exports.getAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalMovies,
      totalTheatres,
      totalShows,
      totalBookings,
      totalSeats,
      bookedSeatsCount,
      revenueResult,
      recentBookings,
    ] = await Promise.all([
      User.countDocuments(),
      Movie.countDocuments(),
      Theatre.countDocuments(),
      Show.countDocuments({ status: 'active' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Seat.countDocuments(),
      Seat.countDocuments({ status: 'booked' }),
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
      ]),
      Booking.find()
        .populate('user', 'name email')
        .populate({
          path: 'show',
          populate: [{ path: 'movie', select: 'title' }, { path: 'theatre', select: 'name' }],
        })
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    const occupancyRate = totalSeats > 0 ? ((bookedSeatsCount / totalSeats) * 100).toFixed(1) : 0;

    // Last 7 days revenue trend for charts
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const revenueByDay = await Booking.aggregate([
      {
        $match: {
          status: 'confirmed',
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          bookings: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Top 5 movies by bookings/revenue
    const topMoviesAgg = await Booking.aggregate([
      { $match: { status: 'confirmed' } },
      {
        $lookup: {
          from: 'shows',
          localField: 'show',
          foreignField: '_id',
          as: 'showData',
        },
      },
      { $unwind: '$showData' },
      {
        $lookup: {
          from: 'movies',
          localField: 'showData.movie',
          foreignField: '_id',
          as: 'movieData',
        },
      },
      { $unwind: '$movieData' },
      {
        $group: {
          _id: '$movieData._id',
          title: { $first: '$movieData.title' },
          poster: { $first: '$movieData.poster' },
          revenue: { $sum: '$totalAmount' },
          ticketsSold: { $sum: { $size: '$seats' } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    return sendSuccess(
      res,
      {
        summary: {
          totalRevenue,
          totalBookings,
          totalUsers,
          totalMovies,
          totalTheatres,
          totalShows,
          occupancyRate: Number(occupancyRate),
          bookedSeatsCount,
          totalSeats,
        },
        revenueTrend: revenueByDay,
        topMovies: topMoviesAgg,
        recentBookings,
      },
      'Admin statistics retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get paginated users list (Admin)
// @route   GET /api/v1/admin/users
// @access  Private/Admin
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      User.countDocuments(query),
    ]);

    return sendSuccess(
      res,
      {
        users,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
      'Users list retrieved'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status (Admin)
// @route   PUT /api/v1/admin/users/:id/toggle-status
// @access  Private/Admin
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }

    if (user._id.toString() === req.user.id) {
      return sendError(res, 'You cannot deactivate your own admin account', 400);
    }

    user.isActive = !user.isActive;
    await user.save();

    return sendSuccess(
      res,
      { user: { id: user._id, name: user.name, isActive: user.isActive } },
      `User account ${user.isActive ? 'activated' : 'deactivated'} successfully`
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get all bookings across the cinema chain (Admin)
// @route   GET /api/v1/admin/bookings
// @access  Private/Admin
exports.getAllBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const query = {};

    if (status) query.status = status;
    if (search) {
      query.bookingCode = { $regex: search, $options: 'i' };
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('user', 'name email phone')
        .populate({
          path: 'show',
          populate: [
            { path: 'movie', select: 'title poster certificate' },
            { path: 'theatre', select: 'name city' },
          ],
        })
        .populate('payment')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Booking.countDocuments(query),
    ]);

    return sendSuccess(
      res,
      {
        bookings,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
      'Bookings retrieved'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get all payments (Admin)
// @route   GET /api/v1/admin/payments
// @access  Private/Admin
exports.getAllPayments = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};

    if (status) query.status = status;

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .populate('user', 'name email')
        .populate({
          path: 'booking',
          select: 'bookingCode totalAmount status',
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Payment.countDocuments(query),
    ]);

    return sendSuccess(
      res,
      {
        payments,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
      'Payments retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Export revenue report as CSV (Admin)
// @route   GET /api/v1/admin/reports/revenue/csv
// @access  Private/Admin
exports.exportRevenueReportCSV = async (req, res, next) => {
  try {
    const bookings = await Booking.find({ status: 'confirmed' })
      .populate('user', 'name email')
      .populate({
        path: 'show',
        populate: [{ path: 'movie', select: 'title' }, { path: 'theatre', select: 'name city' }],
      })
      .populate('payment', 'gateway method transactionId status')
      .sort({ createdAt: -1 })
      .lean();

    let csvContent = 'Booking Code,Date,Customer Name,Customer Email,Movie,Theatre,City,Seats,Amount (INR),Payment Method,Gateway,Transaction ID\n';

    bookings.forEach((b) => {
      const code = b.bookingCode || '';
      const date = b.createdAt ? new Date(b.createdAt).toISOString().split('T')[0] : '';
      const customerName = `"${(b.user?.name || '').replace(/"/g, '""')}"`;
      const customerEmail = `"${(b.user?.email || '').replace(/"/g, '""')}"`;
      const movie = `"${(b.show?.movie?.title || '').replace(/"/g, '""')}"`;
      const theatre = `"${(b.show?.theatre?.name || '').replace(/"/g, '""')}"`;
      const city = `"${(b.show?.theatre?.city || '').replace(/"/g, '""')}"`;
      const seats = `"${b.seats.map((s) => s.seatNumber).join(';')}"`;
      const amount = b.totalAmount || 0;
      const method = b.payment?.method || 'card';
      const gateway = b.payment?.gateway || 'simulated';
      const txnId = b.payment?.transactionId || '';

      csvContent += `${code},${date},${customerName},${customerEmail},${movie},${theatre},${city},${seats},${amount},${method},${gateway},${txnId}\n`;
    });

    res.header('Content-Type', 'text/csv');
    res.attachment(`imovies-revenue-report-${new Date().toISOString().split('T')[0]}.csv`);
    return res.send(csvContent);
  } catch (error) {
    next(error);
  }
};
