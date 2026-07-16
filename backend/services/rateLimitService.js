import redis from '../config/redis.js';

/**
 * Rate Limit Service
 * Sliding window algorithm implementation using Redis Sorted Sets (ZSET).
 */
class RateLimitService {
  /**
   * Check if a request is allowed based on sliding window algorithm
   * 
   * @param {string} key - Redis key (e.g., 'rl:chat:user123:hour')
   * @param {number} limit - Maximum requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {Promise<Object>} Status of the rate limit check
   */
  async checkSlidingWindow(key, limit, windowMs) {
    // Agar limit -1 hai (Unlimited tier), toh sidha allow kardo
    if (limit === -1) {
      return {
        success: true,
        limit: -1,
        used: 0,
        remaining: -1,
        resetsAt: null,
        retryAfterSeconds: 0
      };
    }

    try {
      const now = Date.now();
      const windowStart = now - windowMs;
      const ttlSeconds = Math.ceil(windowMs / 1000);
      // Unique ID har request ke liye (ZSET requires unique members)
      const uniqueMember = `${now}-${Math.random().toString(36).substring(2, 8)}`;

      // Step 1: Upstash Pipeline use karenge taaki multiple commands ek saath execute ho
      const p = redis.pipeline();
      
      // Purane timestamps ko window ke bahar nikal do
      p.zremrangebyscore(key, 0, windowStart);
      
      // Naya request timestamp add karo
      p.zadd(key, { score: now, member: uniqueMember });
      
      // Total count check karo current window me
      p.zcard(key);
      
      // Expire set karo taaki Redis me kachra jama na ho
      p.expire(key, ttlSeconds);
      
      // Execute pipeline
      const results = await p.exec();
      
      // results array me 3rd element zcard ka output hoga (index 2)
      const currentCount = results[2]; 

      // Agar count limit se jyada ho gaya, toh request reject hogi
      if (currentCount > limit) {
        // Jo request humne tentatively add ki thi, usko remove kar dete hain 
        // taaki next valid window affect na ho
        await redis.zrem(key, uniqueMember);

        return {
          success: false,
          limit,
          used: currentCount - 1, // Exclude the rejected one
          remaining: 0,
          resetsAt: new Date(now + windowMs).toISOString(),
          retryAfterSeconds: ttlSeconds
        };
      }

      // Agar limit cross nahi hui, toh allow karo
      return {
        success: true,
        limit,
        used: currentCount,
        remaining: limit - currentCount,
        resetsAt: new Date(now + windowMs).toISOString(),
        retryAfterSeconds: 0
      };

    } catch (error) {
      console.error(`[RateLimitService] Redis failure for key ${key} ❌:`, error.message);
      
      // Fallback Strategy: Agar Redis down ho jaye, toh app crash na ho aur requests paas ho jayein
      return {
        success: true,
        limit,
        used: 1,
        remaining: limit - 1,
        resetsAt: new Date(Date.now() + windowMs).toISOString(),
        retryAfterSeconds: 0,
        fallback: true
      };
    }
  }
}

export default new RateLimitService();
