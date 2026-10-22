require('dotenv').config();
const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const cron = require('node-cron');

const { connectDB } = require('./config/db');
const { initSocket } = require('./sockets/socketHandler');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./config/logger');
const { releaseExpiredLocks } = require('./services/seatLockService');
const { syncMovies } = require('./services/tmdbService');
const { generateRollingShows } = require('./services/showGenerator');
const { seedDatabase } = require('./seed/seed');
const Movie = require('./models/Movie');

const app = express();
const httpServer = http.createServer(app);

// Enable trust proxy for HTTPS deployment behind load balancers (Render, Heroku, etc.)
app.set('trust proxy', 1);

// Initialize real-time Socket.io server
initSocket(httpServer);

// Security Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows dynamic fonts and checkout scripts
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://localhost:5000',
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Allow during deployment on same origin or dynamically
      }
    },
    credentials: true,
  })
);

app.use(compression());

// HTTP request logging
app.use(
  morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  })
);

// Body parser with raw body buffer capture for Razorpay webhook verification
app.use(
  express.json({
    limit: '10mb',
    verify: (req, res, buf) => {
      req.rawBody = buf.toString();
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sanitize inputs to prevent NoSQL injection and XSS
app.use(mongoSanitize());
app.use(xss());

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: { success: false, message: 'Too many authentication attempts, please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  message: { success: false, message: 'Too many payment requests, please try again in a moment.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', generalLimiter);
app.use('/api/v1/auth', authLimiter);
app.use('/api/v1/payments', paymentLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    project: 'IMovies – Movie ticket booking made simple',
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/movies', require('./routes/movieRoutes'));
app.use('/api/v1/theatres', require('./routes/theatreRoutes'));
app.use('/api/v1/shows', require('./routes/showRoutes'));
app.use('/api/v1/bookings', require('./routes/bookingRoutes'));
app.use('/api/v1/payments', require('./routes/paymentRoutes'));
app.use('/api/v1/favorites', require('./routes/favoriteRoutes'));
app.use('/api/v1/reviews', require('./routes/reviewRoutes'));
app.use('/api/v1/admin', require('./routes/adminRoutes'));
app.use('/api/v1/notifications', require('./routes/notificationRoutes'));
app.use('/api/v1/cities', require('./routes/cityRoutes'));
app.use('/api/v1/tickets', require('./routes/ticketRoutes'));

// Background Cron Jobs
let cronJob = null;
if (process.env.NODE_ENV !== 'test') {
  // 1. Release expired seat locks & expired pending bookings every 30 seconds
  cronJob = cron.schedule('*/30 * * * * *', async () => {
    try {
      await releaseExpiredLocks();
    } catch (err) {
      logger.error(`Cron Seat Cleanup Error: ${err.message}`);
    }
  });

  // 2. Daily TMDB sync at 03:00 IST
  cron.schedule('0 3 * * *', async () => {
    try {
      logger.info('[Cron] Running daily live TMDB movie synchronization...');
      await syncMovies();
    } catch (err) {
      logger.error(`Cron TMDB Sync Error: ${err.message}`);
    }
  });

  // 3. Nightly rolling show generator at 00:05 IST (keeps next 7 days filled)
  cron.schedule('5 0 * * *', async () => {
    try {
      logger.info('[Cron] Running nightly 7-day rolling show generator...');
      await generateRollingShows({ daysAhead: 7 });
    } catch (err) {
      logger.error(`Cron Rolling Show Generator Error: ${err.message}`);
    }
  });
}

// Single-deploy production static serving (serve client/dist)
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
} else {
  // 404 for unhandled API routes during development
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      success: false,
      message: `API endpoint '${req.originalUrl}' not found on IMovies Server`,
    });
  });
}

// Centralized error handler
app.use(errorHandler);

// Server startup
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if database is empty
    const count = await Movie.countDocuments();
    if (count === 0) {
      logger.info('Database empty. Running seed script...');
      await seedDatabase();
    }

    if (process.env.NODE_ENV !== 'test') {
      httpServer.listen(PORT, () => {
        logger.info(`======================================================`);
        logger.info(`🎬 IMovies Server running in ${process.env.NODE_ENV || 'development'} mode`);
        logger.info(`🌐 Server Port: http://localhost:${PORT}`);
        logger.info(`📡 Health Check: http://localhost:${PORT}/api/health`);
        logger.info(`======================================================`);
      });
    }

    return { app, httpServer };
  } catch (err) {
    logger.error(`Failed to start server: ${err.message}`);
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw err;
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, httpServer, startServer };
