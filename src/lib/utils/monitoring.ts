'use server';

import { getRedisClient } from '@/lib/redis';
import { createClient } from '@/utils/supabase/server';

/**
 * Queue monitoring information
 */
export interface QueueStats {
  name: string;
  size: number;
  processingRate: number;
  averageProcessingTime: number | null;
  oldestJob: number | null; // timestamp
  recentErrors: number;
}

/**
 * API endpoint performance stats
 */
export interface ApiStats {
  endpoint: string;
  requests: number;
  averageResponseTime: number;
  errorRate: number;
  p95ResponseTime: number;
}

/**
 * System health statistics
 */
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  redisConnection: boolean;
  supabaseConnection: boolean;
  r2Connection: boolean;
  lastCheck: string;
  queueHealth: {
    [key: string]: 'healthy' | 'backlogged' | 'stalled';
  };
}

/**
 * Get statistics for all job queues
 * @returns Array of queue statistics
 */
export async function getQueueStats(): Promise<QueueStats[]> {
  const redis = getRedisClient();
  const queueNames = ['queue:transcription', 'queue:translation', 'queue:summarization'];
  const stats: QueueStats[] = [];

  for (const queueName of queueNames) {
    try {
      // Get queue size
      const size = await redis.llen(queueName);
      
      // Get processing metrics from Redis
      const processingKey = `${queueName}:metrics:processing`;
      const timeKey = `${queueName}:metrics:time`;
      const errorKey = `${queueName}:metrics:errors`;
      
      const processingRate = await redis.get(processingKey) as string | null;
      const processingTimes = await redis.lrange(timeKey, 0, -1);
      const errorCount = await redis.get(errorKey) as string | null;
      
      // Get oldest job timestamp
      const oldest = await redis.lindex(queueName, -1);
      let oldestTimestamp: number | null = null;
      
      if (oldest) {
        try {
          const job = JSON.parse(oldest);
          oldestTimestamp = job.timestamp || null;
        } catch (e) {
          // Ignore parse errors
        }
      }
      
      // Calculate average processing time
      let avgTime: number | null = null;
      
      if (processingTimes.length > 0) {
        const times = processingTimes.map(t => parseInt(t, 10)).filter(t => !isNaN(t));
        if (times.length > 0) {
          avgTime = times.reduce((sum, val) => sum + val, 0) / times.length;
        }
      }
      
      stats.push({
        name: queueName.replace('queue:', ''),
        size,
        processingRate: parseInt(processingRate || '0', 10),
        averageProcessingTime: avgTime,
        oldestJob: oldestTimestamp,
        recentErrors: parseInt(errorCount || '0', 10)
      });
    } catch (error) {
      console.error(`Error getting stats for queue ${queueName}:`, error);
      stats.push({
        name: queueName.replace('queue:', ''),
        size: -1,
        processingRate: 0,
        averageProcessingTime: null,
        oldestJob: null,
        recentErrors: -1
      });
    }
  }
  
  return stats;
}

/**
 * Get API endpoint performance statistics
 * @returns Array of API statistics
 */
export async function getApiStats(): Promise<ApiStats[]> {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys('api:stats:*');
    const stats: ApiStats[] = [];
    
    for (const key of keys) {
      const endpoint = key.split(':')[2];
      const statsData = await redis.hgetall(key);
      
      if (statsData) {
        const requests = parseInt(statsData.requests || '0', 10);
        const totalTime = parseInt(statsData.totalTime || '0', 10);
        const errors = parseInt(statsData.errors || '0', 10);
        const p95 = parseInt(statsData.p95 || '0', 10);
        
        stats.push({
          endpoint,
          requests,
          averageResponseTime: requests > 0 ? totalTime / requests : 0,
          errorRate: requests > 0 ? errors / requests : 0,
          p95ResponseTime: p95
        });
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Error getting API stats:', error);
    return [];
  }
}

/**
 * Check overall system health
 * @returns System health information
 */
export async function checkSystemHealth(): Promise<SystemHealth> {
  const health: SystemHealth = {
    status: 'healthy',
    redisConnection: false,
    supabaseConnection: false,
    r2Connection: false,
    lastCheck: new Date().toISOString(),
    queueHealth: {}
  };
  
  // Check Redis connection
  try {
    const redis = getRedisClient();
    await redis.ping();
    health.redisConnection = true;
  } catch (error) {
    health.redisConnection = false;
    health.status = 'degraded';
  }
  
  // Check Supabase connection
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from('_health').select('*').limit(1);
    health.supabaseConnection = !error;
    if (error) health.status = 'degraded';
  } catch (error) {
    health.supabaseConnection = false;
    health.status = 'degraded';
  }
  
  // Check queue health
  const queueStats = await getQueueStats();
  let unhealthyQueues = 0;
  
  for (const queue of queueStats) {
    // Queue is considered backlogged if it has more than 100 jobs
    if (queue.size > 100) {
      health.queueHealth[queue.name] = 'backlogged';
      unhealthyQueues++;
    } 
    // Queue is considered stalled if the oldest job is more than 1 hour old
    else if (queue.oldestJob && Date.now() - queue.oldestJob > 3600000) {
      health.queueHealth[queue.name] = 'stalled';
      unhealthyQueues++;
    } else {
      health.queueHealth[queue.name] = 'healthy';
    }
  }
  
  // If any connection is down or multiple queues are unhealthy, system is unhealthy
  if (!health.redisConnection || !health.supabaseConnection || unhealthyQueues > 1) {
    health.status = 'unhealthy';
  } else if (unhealthyQueues === 1) {
    health.status = 'degraded';
  }
  
  return health;
}

/**
 * Record request metrics for API monitoring
 * @param endpoint API endpoint path
 * @param responseTime Response time in ms
 * @param isError Whether the request resulted in an error
 */
export async function recordApiMetrics(
  endpoint: string,
  responseTime: number,
  isError: boolean
): Promise<void> {
  try {
    const redis = getRedisClient();
    const key = `api:stats:${endpoint}`;
    
    // Increment request count
    await redis.hincrby(key, 'requests', 1);
    
    // Add to total response time
    await redis.hincrby(key, 'totalTime', responseTime);
    
    // Increment error count if applicable
    if (isError) {
      await redis.hincrby(key, 'errors', 1);
    }
    
    // Update p95 response time (simplified approach)
    const p95 = await redis.hget(key, 'p95') as string | null;
    const currentP95 = p95 ? parseInt(p95, 10) : 0;
    
    if (responseTime > currentP95) {
      await redis.hset(key, 'p95', responseTime);
    }
    
    // Auto-expire the stats after 7 days
    await redis.expire(key, 604800);
  } catch (error) {
    // Silently fail - we don't want monitoring to affect the main application
    console.error('Error recording API metrics:', error);
  }
} 