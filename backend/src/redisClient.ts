import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const redisClient = createClient({
  url: redisUrl
});

let isRedisConnected = false;

redisClient.on('error', (err) => {
  // We log once and toggle flag to prevent crashing the app if Redis isn't running locally
  if (isRedisConnected) {
    console.error('Redis Client Error', err);
    isRedisConnected = false;
  }
});

redisClient.on('connect', () => {
  console.log('✅ Connected to Redis');
  isRedisConnected = true;
});

// Try to connect, but don't crash if it fails
redisClient.connect().catch(() => {
  console.warn('⚠️  Could not connect to Redis. Caching will be bypassed. Start Redis to enable caching.');
  isRedisConnected = false;
});

export const getCache = async (key: string) => {
  if (!isRedisConnected) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
};

export const setCache = async (key: string, value: any, ttlSeconds: number = 300) => {
  if (!isRedisConnected) return;
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    // ignore
  }
};

export const clearCache = async (keyPrefix: string) => {
  if (!isRedisConnected) return;
  try {
    const keys = await redisClient.keys(`${keyPrefix}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (err) {
    // ignore
  }
};

export default redisClient;
