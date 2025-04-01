'use client';

import { Redis } from '@upstash/redis';

// Initialize Redis client
let redisClient: Redis | null = null;

export function getRedisClient() {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL || '',
      token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
    });
  }
  return redisClient;
}

/**
 * Caches data with a specified TTL
 * @param key The cache key
 * @param data The data to cache
 * @param ttl Time to live in seconds (default: 1 hour)
 * @returns Success status
 */
export async function cacheData<T>(key: string, data: T, ttl: number = 3600): Promise<boolean> {
  try {
    const redis = getRedisClient();
    await redis.set(key, JSON.stringify(data), { ex: ttl });
    return true;
  } catch (error) {
    console.error('Redis cache error:', error);
    return false;
  }
}

/**
 * Retrieves data from cache
 * @param key The cache key
 * @returns The cached data or null if not found
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  try {
    const redis = getRedisClient();
    const data = await redis.get(key);
    if (!data) return null;
    return JSON.parse(data as string) as T;
  } catch (error) {
    console.error('Redis get error:', error);
    return null;
  }
}

/**
 * Removes data from cache
 * @param key The cache key to invalidate
 * @returns Success status
 */
export async function invalidateCache(key: string): Promise<boolean> {
  try {
    const redis = getRedisClient();
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Redis invalidate error:', error);
    return false;
  }
}

/**
 * Adds a job to a queue
 * @param queueName The name of the queue
 * @param jobData The job data
 * @returns Success status
 */
export async function addJobToQueue<T>(queueName: string, jobData: T): Promise<boolean> {
  try {
    const redis = getRedisClient();
    await redis.lpush(queueName, JSON.stringify(jobData));
    return true;
  } catch (error) {
    console.error('Redis queue error:', error);
    return false;
  }
}

/**
 * Gets the next job from a queue
 * @param queueName The name of the queue
 * @returns The next job or null if queue is empty
 */
export async function getNextJob<T>(queueName: string): Promise<T | null> {
  try {
    const redis = getRedisClient();
    const job = await redis.rpop(queueName);
    if (!job) return null;
    return JSON.parse(job as string) as T;
  } catch (error) {
    console.error('Redis dequeue error:', error);
    return null;
  }
}

/**
 * Creates a distributed lock
 * @param lockName The name of the lock
 * @param ttl Time to live in seconds (default: 30 seconds)
 * @returns Lock success status
 */
export async function acquireLock(lockName: string, ttl: number = 30): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const result = await redis.set(
      `lock:${lockName}`, 
      Date.now().toString(), 
      { nx: true, ex: ttl }
    );
    return result === 'OK';
  } catch (error) {
    console.error('Redis lock error:', error);
    return false;
  }
}

/**
 * Releases a distributed lock
 * @param lockName The name of the lock to release
 * @returns Release success status
 */
export async function releaseLock(lockName: string): Promise<boolean> {
  try {
    const redis = getRedisClient();
    await redis.del(`lock:${lockName}`);
    return true;
  } catch (error) {
    console.error('Redis unlock error:', error);
    return false;
  }
}

/**
 * Increments a rate limit counter
 * @param key The rate limit key (typically user ID or IP)
 * @param resource The resource being rate limited
 * @param ttl Time to live in seconds (default: 60 seconds)
 * @returns Current count after increment
 */
export async function incrementRateLimit(
  key: string, 
  resource: string, 
  ttl: number = 60
): Promise<number> {
  try {
    const redis = getRedisClient();
    const limitKey = `ratelimit:${resource}:${key}`;
    const count = await redis.incr(limitKey);
    
    // Set expiry on first increment
    if (count === 1) {
      await redis.expire(limitKey, ttl);
    }
    
    return count;
  } catch (error) {
    console.error('Redis rate limit error:', error);
    return 0;
  }
}

/**
 * Checks if a rate limit has been exceeded
 * @param key The rate limit key (typically user ID or IP)
 * @param resource The resource being rate limited
 * @param limit Maximum allowed requests in the period
 * @returns Whether the rate limit has been exceeded
 */
export async function checkRateLimit(
  key: string, 
  resource: string, 
  limit: number
): Promise<boolean> {
  try {
    const redis = getRedisClient();
    const limitKey = `ratelimit:${resource}:${key}`;
    const count = await redis.get(limitKey);
    
    if (!count) return false;
    return parseInt(count as string) > limit;
  } catch (error) {
    console.error('Redis rate check error:', error);
    return false; // Default to allowing requests on error
  }
} 