import mongoose from 'mongoose';
import config from './index.js';
import logger from '../utils/logger.js';

class Database {
  constructor() {
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000;
    this.isConnected = false;

    mongoose.set('strictQuery', false);

    mongoose.connection.on('connected', () => {
      this.isConnected = true;
      this.retryCount = 0;
      logger.info('📦 MongoDB connected successfully');
    });

    mongoose.connection.on('error', (err) => {
      this.isConnected = false;
      logger.error('MongoDB connection error:', err.message);
    });

    mongoose.connection.on('disconnected', () => {
      this.isConnected = false;
      logger.warn('MongoDB disconnected');
      if (config.env !== 'test') this._reconnect();
    });
  }

  async connect() {
    try {
      // Event listeners are in the constructor


      await mongoose.connect(config.mongoose.url, config.mongoose.options);
      return mongoose.connection;
    } catch (error) {
      logger.error('MongoDB initial connection failed:', error.message);
      return this._reconnect();
    }
  }

  async _reconnect() {
    if (this.retryCount >= this.maxRetries) {
      logger.error(`MongoDB: Max retries (${this.maxRetries}) reached. Exiting.`);
      process.exit(1);
    }

    this.retryCount++;
    logger.info(`MongoDB: Retry ${this.retryCount}/${this.maxRetries} in ${this.retryDelay / 1000}s...`);

    await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
    return this.connect();
  }

  async disconnect() {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('MongoDB disconnected gracefully');
    }
  }

  getStatus() {
    const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
    return {
      status: states[mongoose.connection.readyState] || 'unknown',
      host: mongoose.connection.host,
      name: mongoose.connection.name,
    };
  }
}

export default new Database();
