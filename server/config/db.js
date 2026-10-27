const mongoose = require('mongoose');

let memoryServer = null;
let cachedConnection = null;
let cachedPromise = null;

/**
 * Determine if running in a production or Vercel serverless environment
 */
const isProductionEnv = () => {
  return process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
};

/**
 * Connect to MongoDB with connection reuse for serverless functions
 * and strict production security checks.
 */
const connectDB = async () => {
  // 1. Read MONGODB_URI (preferred) or MONGO_URI (alias)
  const rawUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const uri = rawUri ? rawUri.trim() : '';
  const isProd = isProductionEnv();

  // 2. Strict Production Checks
  if (isProd) {
    if (!uri) {
      const errMsg =
        '[Database Error] MONGODB_URI environment variable is not defined. ' +
        'In production/Vercel environments, a remote MongoDB Atlas connection string must be configured in project settings.';
      console.error(errMsg);
      throw new Error(errMsg);
    }

    if (uri.includes('localhost') || uri.includes('127.0.0.1')) {
      const errMsg =
        '[Database Error] Cannot connect to localhost MongoDB in production. ' +
        'Please set MONGODB_URI in Vercel environment variables to your remote cloud-hosted MongoDB Atlas URI.';
      console.error(errMsg);
      throw new Error(errMsg);
    }
  }

  // 3. Return existing active connection immediately (Serverless connection reuse)
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  // 4. Return in-flight connection promise if currently connecting
  if (cachedPromise) {
    return cachedPromise;
  }

  const effectiveUri = uri || 'mongodb://localhost:27017/imovies';
  console.log('[Database] Connecting to MongoDB instance...');

  // 5. Connect to MongoDB
  cachedPromise = mongoose
    .connect(effectiveUri, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: !isProd, // Disable auto-indexing in production for performance
    })
    .then((conn) => {
      cachedConnection = conn;
      cachedPromise = null;
      console.log('[Database] MongoDB connected successfully.');
      return conn;
    })
    .catch(async (error) => {
      cachedPromise = null;
      cachedConnection = null;

      // In production, NEVER switch to in-memory fallback. Fail fast with clear error.
      if (isProd) {
        console.error(`[Database Error] Failed to connect to MongoDB Atlas (${error.message}).`);
        throw error;
      }

      // Local development fallback only
      console.warn(
        `[Database] Local MongoDB connection failed (${error.message}). Initializing MongoMemoryServer for local development...`
      );
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        if (!memoryServer) {
          memoryServer = await MongoMemoryServer.create({
            instance: { launchTimeout: 60000 },
          });
        }
        const memUri = memoryServer.getUri();
        console.log('[Database] MongoMemoryServer started for local development fallback.');
        const conn = await mongoose.connect(memUri);
        cachedConnection = conn;
        console.log('[Database] Connected to in-memory fallback MongoDB.');
        return conn;
      } catch (memError) {
        console.error(`[Database Error] Error connecting to fallback MongoDB: ${memError.message}`);
        throw memError;
      }
    });

  return cachedPromise;
};

const disconnectDB = async () => {
  try {
    cachedPromise = null;
    cachedConnection = null;
    await mongoose.connection.close();
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
  } catch (error) {
    console.error('[Database Error] Error disconnecting MongoDB:', error);
  }
};

module.exports = { connectDB, disconnectDB, isProductionEnv };
