import redis from '../config/redis.js';

/**
 * Redis Service - Wrapper for Upstash Redis operations
 * Yeh service humare rate limiting aur caching logic ke liye basic Redis operations handle karti hai.
 * It provides structured logging, error handling, and graceful fallbacks.
 */
class RedisService {
  /**
   * Health Check to verify Redis connection
   * @returns {Promise<boolean>} True if connected, false otherwise
   */
  async healthCheck() {
    try {
      const response = await redis.ping();
      if (response === 'PONG' || response === 'pong') {
        console.log('[Redis] Connection stable, PONG received 🚀');
        return true;
      }
      return true;
    } catch (error) {
      console.error('[Redis] Connection error ❌:', error.message);
      return false; // Graceful degradation
    }
  }

  /**
   * Get a value by key
   * @param {string} key
   * @returns {Promise<any>}
   */
  async get(key) {
    try {
      return await redis.get(key);
    } catch (error) {
      console.error(`[Redis] GET failed for key: ${key} ❌:`, error.message);
      return null; 
    }
  }

  /**
   * Set a value with optional TTL (time to live)
   * @param {string} key 
   * @param {any} value 
   * @param {number} [expireSeconds] 
   * @returns {Promise<boolean>}
   */
  async set(key, value, expireSeconds = null) {
    try {
      if (expireSeconds) {
        await redis.set(key, value, { ex: expireSeconds });
      } else {
        await redis.set(key, value);
      }
      return true;
    } catch (error) {
      console.error(`[Redis] SET failed for key: ${key} ❌:`, error.message);
      return false;
    }
  }

  /**
   * Increment a counter (Perfect for Rate Limiting)
   * @param {string} key 
   * @returns {Promise<number|null>} New count or null on failure
   */
  async incr(key) {
    try {
      return await redis.incr(key);
    } catch (error) {
      console.error(`[Redis] INCR failed for key: ${key} ❌:`, error.message);
      return null;
    }
  }

  /**
   * Set expiration time on an existing key
   * @param {string} key 
   * @param {number} seconds 
   * @returns {Promise<boolean>}
   */
  async expire(key, seconds) {
    try {
      const result = await redis.expire(key, seconds);
      return result === 1 || result === true; // Handle Upstash boolean / integer returns
    } catch (error) {
      console.error(`[Redis] EXPIRE failed for key: ${key} ❌:`, error.message);
      return false;
    }
  }

  /**
   * Delete a specific key
   * @param {string} key 
   * @returns {Promise<boolean>}
   */
  async del(key) {
    try {
      await redis.del(key);
      return true;
    } catch (error) {
      console.error(`[Redis] DEL failed for key: ${key} ❌:`, error.message);
      return false;
    }
  }
}

export default new RedisService();
