import mongoose from 'mongoose';
import { env } from './env.js';
import logger from '../utils/logger.js';

export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.MONGODB_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    throw error;
  }
}

export async function disconnectDB() {
  await mongoose.disconnect();
}

