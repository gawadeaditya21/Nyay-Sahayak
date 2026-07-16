import rateLimitService from '../services/rateLimitService.js';
import { getTierConfig } from '../config/rateLimits.config.js';

/**
 * Main Rate Limiter Middleware Factory
 * Yeh function ek Express middleware return karta hai jo endpoint aur timeframe ke hisab se rate limit check karta hai.
 * 
 * @param {string} endpoint - The API endpoint being accessed (e.g., 'chat', 'analysis', 'fir')
 * @param {string} timeframe - The time window to check ('perHour' or 'perDay')
 */
export const createRateLimiter = (endpoint, timeframe = 'perHour') => {
  return async (req, res, next) => {
    try {
      // req.user.tierDetection (Step 5) se hume tier mil jayega. 
      // Abhi fallback 'GUEST' set kar dete hain just in case.
      const tierName = req.user?.subscriptionTier || 'GUEST';
      const tierConfig = getTierConfig(tierName);

      // Agar user ADMIN ya ENTERPRISE hai, toh seedha bypass karo (fast path)
      if (tierConfig.bypassRateLimit) {
        return next();
      }

      // Find the specific limit for this endpoint and timeframe
      const limit = tierConfig.limits[endpoint]?.[timeframe];

      // Agar limit defined nahi hai (e.g. voice perHour), ya access allowed nahi hai (e.g. limit 0)
      if (limit === undefined) {
        console.warn(`[RateLimiter] Missing config for ${endpoint}:${timeframe} in tier ${tierName}`);
        return next(); // Failsafe allow
      }

      if (limit === 0) {
        return res.status(403).json({
          error: "Feature Not Allowed",
          message: `Your current tier (${tierName}) does not have access to this feature.`,
          message_hindi: `Aapke current plan (${tierName}) mein yeh feature allowed nahi hai.`,
          upgrade: {
            message: tierConfig.upgradeMessage || 'Please upgrade your plan to access this feature.',
            url: tierConfig.upgradeUrl || '/pricing'
          }
        });
      }

      // Tracking Identifier: User ID (logged in) varna unka IP address (guest)
      const identifier = tierConfig.tracking === 'user' && req.user?._id
        ? req.user._id.toString()
        : req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown-ip';

      // Redis key e.g., 'rl:chat:userId123:perHour'
      const key = `rl:${endpoint}:${identifier}:${timeframe}`;
      
      // Calculate window time in milliseconds
      const windowMs = timeframe === 'perHour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

      // Sliding Window service se check karwao
      const result = await rateLimitService.checkSlidingWindow(key, limit, windowMs);

      // Response Headers zaroor set karna (Standard Practice)
      res.setHeader('X-RateLimit-Tier', tierName);
      res.setHeader('X-RateLimit-Limit', result.limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, result.remaining));
      if (result.resetsAt) {
        res.setHeader('X-RateLimit-Reset', Math.floor(new Date(result.resetsAt).getTime() / 1000));
      }
      res.setHeader('X-RateLimit-Endpoint', endpoint);

      if (result.success) {
        // Yay! Request allowed
        return next();
      } else {
        // 429 Too Many Requests - Rich Error Response with Upgrade Prompts
        const nextTierName = tierName === 'FREE' ? 'PRO' : 'PLUS';
        const nextTierConfig = getTierConfig(nextTierName);
        
        // Asynchronously log to MongoDB for Analytics / Admin Dashboard
        // (No await to avoid slowing down the response)
        try {
          const AuditLog = (await import('../../models/AuditLog.js')).default;
          AuditLog.create({
            user: identifier,
            action: `RATE_LIMIT_EXCEEDED_${endpoint.toUpperCase()}`,
            target: timeframe,
            type: 'SECURITY',
            ip: req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown-ip'
          }).catch(err => console.error('[RateLimiter] Analytics DB save failed:', err.message));
        } catch (err) {
          // Model import failed gracefully
        }

        return res.status(429).json({
          error: "Rate limit exceeded",
          message: `You have used ${result.used}/${result.limit} ${endpoint} requests this ${timeframe.replace('per', '')}`,
          message_hindi: `Aapne is ${timeframe === 'perHour' ? 'ghante' : 'din'} mein ${result.used}/${result.limit} messages use kar liye`,
          current_tier: tierName,
          limit: result.limit,
          used: result.used,
          remaining: 0,
          resets_at: result.resetsAt,
          retry_after_seconds: result.retryAfterSeconds,
          upgrade: tierConfig.upgradeUrl ? {
            message: tierConfig.upgradeMessage,
            url: tierConfig.upgradeUrl,
            tier: nextTierName,
            price: nextTierConfig.price
          } : null
        });
      }
    } catch (error) {
      console.error(`[RateLimiter] Middleware Error ❌:`, error.message);
      // Fallback: Agar middleware fail hota hai, toh app rokna nahi hai.
      next();
    }
  };
};
