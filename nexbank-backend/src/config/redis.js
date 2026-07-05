import { createClient } from 'redis';
import logger from './logger.js';
import MemoryStore from './memoryStore.js';

/** @type {import('redis').RedisClientType | MemoryStore | null} */
let redisClient = null;

/** @type {'redis' | 'memory' | null} */
let storeType = null;

/**
 * Check if real Redis is enabled via environment variable.
 * @returns {boolean}
 */
const isRedisEnabled = () => process.env.REDIS_ENABLED === 'true';

/**
 * Create and connect to Redis, or fall back to in-memory store.
 * @returns {Promise<import('redis').RedisClientType | MemoryStore>} Connected store client
 */
export const connectRedis = async () => {
  if (!isRedisEnabled()) {
    redisClient = new MemoryStore();
    storeType = 'memory';
    await redisClient.connect();
    logger.warn(
      'REDIS_ENABLED=false — using in-memory store. OTP/sessions will reset on server restart.',
    );
    return redisClient;
  }

  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    const client = createClient({ url });

    client.on('error', (err) => {
      logger.error(`Redis error: ${err.message}`);
    });

    client.on('connect', () => {
      logger.info('Redis connected');
    });

    await client.connect();
    redisClient = client;
    storeType = 'redis';
    return redisClient;
  } catch (error) {
    logger.warn(`Redis connection failed: ${error.message}. Falling back to in-memory store.`);
    redisClient = new MemoryStore();
    storeType = 'memory';
    await redisClient.connect();
    return redisClient;
  }
};

/**
 * Get the active Redis or memory store client.
 * @returns {import('redis').RedisClientType | MemoryStore} Store client
 * @throws {Error} If store is not initialized
 */
export const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Store client is not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

/**
 * Returns whether the app is using real Redis or in-memory fallback.
 * @returns {'redis' | 'memory' | null}
 */
export const getStoreType = () => storeType;

/**
 * Gracefully disconnect from Redis or clear memory store.
 * @returns {Promise<void>}
 */
export const disconnectRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    storeType = null;
    logger.info('Store connection closed');
  }
};

export default connectRedis;
