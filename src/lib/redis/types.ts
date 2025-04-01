/**
 * Cache interfaces for Redis
 */

export interface Cache {
  /**
   * Set a key value pair in the cache with optional TTL
   */
  set<T>(key: string, value: T, ttl?: number): Promise<boolean>;
  
  /**
   * Get a value from the cache by key
   */
  get<T>(key: string): Promise<T | null>;
  
  /**
   * Delete a value from the cache by key
   */
  del(key: string): Promise<boolean>;
}

/**
 * Redis job queue interfaces
 */
export interface Queue {
  /**
   * Add a job to the queue
   */
  enqueue<T>(queue: string, job: T): Promise<boolean>;
  
  /**
   * Get the next job from the queue
   */
  dequeue<T>(queue: string): Promise<T | null>;
  
  /**
   * Get the number of jobs in the queue
   */
  size(queue: string): Promise<number>;
}

/**
 * Redis rate limiter interfaces
 */
export interface RateLimiter {
  /**
   * Increment a rate limit counter
   */
  increment(key: string, resource: string, ttl?: number): Promise<number>;
  
  /**
   * Check if a rate limit has been exceeded
   */
  check(key: string, resource: string, limit: number): Promise<boolean>;
}

/**
 * Redis distributed lock interfaces
 */
export interface Lock {
  /**
   * Acquire a distributed lock
   */
  acquire(name: string, ttl?: number): Promise<boolean>;
  
  /**
   * Release a distributed lock
   */
  release(name: string): Promise<boolean>;
} 