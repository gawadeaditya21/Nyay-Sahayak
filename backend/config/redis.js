import { Redis } from '@upstash/redis';

/**
 * Upstash Redis Configuration
 * Using standard environment variables configured in .env
 */
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

export default redis;
