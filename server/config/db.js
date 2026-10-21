const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/imovies';

  try {
    console.log(`Connecting to MongoDB at: ${uri}...`);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000,
    });
    console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`Local MongoDB connection failed (${error.message}). Initializing MongoMemoryServer fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create({
        instance: { launchTimeout: 60000 },
      });
      const memUri = memoryServer.getUri();
      console.log(`MongoMemoryServer started at: ${memUri}`);
      const conn = await mongoose.connect(memUri);
      console.log(`Connected to in-memory MongoDB: ${conn.connection.host}`);
      return conn;
    } catch (memError) {
      console.error(`Error connecting to fallback MongoDB: ${memError.message}`);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (memoryServer) {
      await memoryServer.stop();
    }
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error);
  }
};

module.exports = { connectDB, disconnectDB };
