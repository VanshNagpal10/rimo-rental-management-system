/**
 * MongoDB Atlas Connection Utility
 * Handles database connection with connection pooling and error handling
 * Uses singleton pattern to prevent multiple connections in development
 */

import mongoose from 'mongoose';
import { logger } from './logger';

// Connection interface for TypeScript
interface MongoConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global variable to store the connection (for development hot reloading)
declare global {
  var mongoose: MongoConnection | undefined;
}

// MongoDB URI from environment variables with fallback for development
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rimo';

if (!MONGODB_URI || MONGODB_URI === 'mongodb://127.0.0.1:27017/rimo') {
  logger.warn('Using default MongoDB URI for development. Please set MONGODB_URI in .env.local for production.');
}

// Cached connection object
let cached: MongoConnection = global.mongoose || {
  conn: null,
  promise: null,
};

// Store the cached connection globally in development
if (process.env.NODE_ENV === 'development') {
  global.mongoose = cached;
}

/**
 * Connect to MongoDB Atlas with error handling and logging
 * @returns Promise<typeof mongoose> - The mongoose connection
 */
async function connectDB(): Promise<typeof mongoose> {
  // Return existing connection if available
  if (cached.conn) {
    logger.debug('Using existing MongoDB connection');
    return cached.conn;
  }

  // Return pending connection promise if connection is in progress
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    logger.info('Establishing new MongoDB connection...');
    
    // Create new connection promise
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      logger.info('Successfully connected to MongoDB Atlas');
      logger.database('CONNECT', 'MongoDB Atlas', { 
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name 
      });
      return mongoose;
    }).catch((error) => {
      logger.error('Failed to connect to MongoDB Atlas', { error: error.message });
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    logger.error('MongoDB connection failed', { error: e });
    throw e;
  }

  return cached.conn;
}

/**
 * Disconnect from MongoDB (useful for cleanup in tests)
 */
export async function disconnectDB(): Promise<void> {
  if (cached.conn) {
    logger.info('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    logger.database('DISCONNECT', 'MongoDB Atlas');
  }
}

/**
 * Check if database is connected
 * @returns boolean - Connection status
 */
export function isConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Get current connection state
 * @returns string - Connection state description
 */
export function getConnectionState(): string {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return states[mongoose.connection.readyState as keyof typeof states] || 'unknown';
}

// Connection event listeners for logging
mongoose.connection.on('connected', () => {
  logger.info('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  logger.error('MongoDB connection error', { error: err.message });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB connection lost');
});

// Graceful shutdown handling
process.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing MongoDB connection...');
  await disconnectDB();
  process.exit(0);
});

export default connectDB;
