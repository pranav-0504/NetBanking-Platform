import logger from './logger.js';

/**
 * In-memory key-value store that mimics basic Redis operations.
 * Used when Redis is unavailable (local dev without Redis installed).
 */
class MemoryStore {
  constructor() {
    /** @type {Map<string, { value: string, expiresAt: number | null }>} */
    this.store = new Map();
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), 60_000);
  }

  /**
   * Remove expired keys from the store.
   */
  cleanupExpired() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt !== null && entry.expiresAt <= now) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Simulate Redis connect — no-op for memory store.
   * @returns {Promise<void>}
   */
  async connect() {
    logger.info('In-memory store initialized (Redis not available)');
  }

  /**
   * Clear all keys and stop cleanup timer.
   * @returns {Promise<void>}
   */
  async quit() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }

  /**
   * Get a value by key.
   * @param {string} key
   * @returns {Promise<string | null>}
   */
  async get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt !== null && entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  /**
   * Set a key-value pair.
   * @param {string} key
   * @param {string} value
   * @returns {Promise<string>}
   */
  async set(key, value) {
    this.store.set(key, { value: String(value), expiresAt: null });
    return 'OK';
  }

  /**
   * Set a key with TTL in seconds.
   * @param {string} key
   * @param {number} seconds
   * @param {string} value
   * @returns {Promise<string>}
   */
  async setEx(key, seconds, value) {
    this.store.set(key, {
      value: String(value),
      expiresAt: Date.now() + seconds * 1000,
    });
    return 'OK';
  }

  /**
   * Delete a key.
   * @param {string} key
   * @returns {Promise<number>}
   */
  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }

  /**
   * Check if a key exists.
   * @param {string} key
   * @returns {Promise<number>}
   */
  async exists(key) {
    const val = await this.get(key);
    return val !== null ? 1 : 0;
  }
}

export default MemoryStore;
