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

// Enable trust proxy for HTTPS deployment behind load balancers (Vercel, Render, AWS, etc.)
app.set('trust proxy', 1);

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
        callback(null, true); // Allow during deployment on same origin or preview deployments
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

// Serverless Database Connection Middleware:
// Ensures MongoDB Atlas is connected before any API route handler executes.
// Reuses cached connection for 0ms overhead; avoids running seed operations on cold starts.
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await connectDB();
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

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
app.use('/api/auth', authLimiter);
app.use('/api/v1/payments', paymentLimiter);
app.use('/api/payments', paymentLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    project: 'IMovies – Movie ticket booking made simple',
    version: '1.0.0',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    serverless: Boolean(process.env.VERCEL),
  });
});

// Register API routes on both /api and /api/v1 for seamless frontend & client compatibility
const registerRoutes = (prefix) => {
  app.use(`${prefix}/auth`, require('./routes/authRoutes'));
  app.use(`${prefix}/movies`, require('./routes/movieRoutes'));
  app.use(`${prefix}/theatres`, require('./routes/theatreRoutes'));
  app.use(`${prefix}/cinemas`, require('./routes/theatreRoutes')); // Alias cinemas -> theatres
  app.use(`${prefix}/shows`, require('./routes/showRoutes'));
  app.use(`${prefix}/bookings`, require('./routes/bookingRoutes'));
  app.use(`${prefix}/payments`, require('./routes/paymentRoutes'));
  app.use(`${prefix}/favorites`, require('./routes/favoriteRoutes'));
  app.use(`${prefix}/reviews`, require('./routes/reviewRoutes'));
  app.use(`${prefix}/admin`, require('./routes/adminRoutes'));
  app.use(`${prefix}/notifications`, require('./routes/notificationRoutes'));
  app.use(`${prefix}/cities`, require('./routes/cityRoutes'));
  app.use(`${prefix}/tickets`, require('./routes/ticketRoutes'));
};

registerRoutes('/api/v1');
registerRoutes('/api');

// Centralized error handler
app.use(errorHandler);

// Standalone Server startup (Local development / Docker / persistent VM)
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Auto-seed if database is empty in local development
    const count = await Movie.countDocuments();
    if (count === 0) {
      logger.info('Database empty. Running seed script...');
      await seedDatabase();
    }

    if (process.env.NODE_ENV !== 'test') {
      initSocket(httpServer);

      // Background Cron Jobs: Only enabled in persistent node processes, never in serverless or test
      try {
        const cron = require('node-cron');

        // 1. Release expired seat locks & expired pending bookings every 30 seconds
        cron.schedule('*/30 * * * * *', async () => {
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
      } catch (err) {
        logger.warn(`Cron initialization skipped: ${err.message}`);
      }

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

// Start standalone HTTP listener ONLY if executed directly via `node server/server.js`
// and NOT inside Vercel serverless runtime or test suites
if (!process.env.VERCEL && require.main === module && process.env.NODE_ENV !== 'test') {
  startServer();
}

// CommonJS Exports:
// The default export is the Express application instance (for Vercel serverless functions)
module.exports = app;
module.exports.app = app;
module.exports.httpServer = httpServer;
module.exports.startServer = startServer;
