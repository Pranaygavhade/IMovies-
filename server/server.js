require('dotenv').config();
const http = require('http');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/db');
const { initSocket } = require('./sockets/socketHandler');
const errorHandler = require('./middleware/errorHandler');

// Models for cleanup and auto-seeding
const Movie = require('./models/Movie');
const Seat = require('./models/Seat');
const { seedDatabase } = require('./seed/seed');
const { broadcastSeatReleased } = require('./sockets/socketHandler');

const app = express();
const httpServer = http.createServer(app);

// Initialize real-time Socket.io
initSocket(httpServer);

// Security & Optimization Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow during local development
      }
    },
    credentials: true,
  })
);

app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 600,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many authentication attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', generalLimiter);
app.use('/api/v1/auth', authLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    project: 'IMovies - Movie ticket booking made simple',
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Mount API Routes (v1)
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/movies', require('./routes/movieRoutes'));
app.use('/api/v1/theatres', require('./routes/theatreRoutes'));
app.use('/api/v1/shows', require('./routes/showRoutes'));
app.use('/api/v1/bookings', require('./routes/bookingRoutes'));
app.use('/api/v1/payments', require('./routes/paymentRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found on IMovies Server`,
  });
});

// Centralized error handler
app.use(errorHandler);

// Background interval to auto-release expired seat locks every 25 seconds
const startSeatCleanupJob = () => {
  setInterval(async () => {
    try {
      const now = new Date();
      const expiredSeats = await Seat.find({
        status: 'locked',
        lockExpiresAt: { $lt: now },
      }).select('show seatNumber');

      if (expiredSeats.length > 0) {
        // Group by show
        const showMap = {};
        for (const s of expiredSeats) {
          const sId = s.show.toString();
          if (!showMap[sId]) showMap[sId] = [];
          showMap[sId].push(s.seatNumber);
        }

        // Release expired seats
        await Seat.updateMany(
          {
            _id: { $in: expiredSeats.map((s) => s._id) },
          },
          {
            $set: {
              status: 'available',
              lockedBy: null,
              lockExpiresAt: null,
            },
          }
        );

        // Broadcast release event to each room
        for (const showId in showMap) {
          broadcastSeatReleased(showId, showMap[showId]);
        }
        console.log(`[SeatCleanup] Released ${expiredSeats.length} expired seat lock(s) across ${Object.keys(showMap).length} show(s).`);
      }
    } catch (err) {
      console.error('[SeatCleanup Error]:', err.message);
    }
  }, 25000);
};

// Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if database is empty
    const movieCount = await Movie.countDocuments();
    if (movieCount === 0) {
      console.log('Database is empty. Running initial auto-seed for IMovies...');
      await seedDatabase();
    }

    startSeatCleanupJob();

    if (process.env.NODE_ENV !== 'test') {
      httpServer.listen(PORT, () => {
        console.log(`\n======================================================`);
        console.log(`🚀 IMovies Server running in ${process.env.NODE_ENV || 'development'} mode`);
        console.log(`🌐 Server Port: http://localhost:${PORT}`);
        console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
        console.log(`======================================================\n`);
      });
    }
    return { app, httpServer };
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, httpServer, startServer };
