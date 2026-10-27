// Vercel Serverless Function entry point for iMovies
// Extracts Express app and ensures active MongoDB Atlas connection before handling requests
const { connectDB } = require('../server/config/db');
const serverModule = require('../server/server');

// Extract the Express application instance
const app = serverModule.app || serverModule;

/**
 * Serverless request handler for Vercel:
 * 1. Guarantees MongoDB Atlas connection is established before processing API requests.
 * 2. Reuses existing active connection on warm lambdas in 0ms.
 * 3. Dispatches the request to the Express application instance.
 */
const handler = async (req, res) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('[Vercel Serverless] Database connection failure:', err.message);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(
      JSON.stringify({
        success: false,
        message: 'Database connection failed. Please ensure MONGODB_URI is configured.',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message,
      })
    );
  }

  return app(req, res);
};

// Retain Express application properties for compatibility
handler.app = app;

module.exports = handler;
