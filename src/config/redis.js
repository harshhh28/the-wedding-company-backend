/**
 * Redis Configuration and Cache Service
 * Provides caching layer for frequently accessed data
 */

const Redis = require("ioredis");

let redisClient = null;
let isRedisConnected = false;
let connectionAttempted = false;

/**
 * Initialize Redis connection
 * Falls back gracefully if Redis is unavailable
 */
const connectRedis = async () => {
  // Only attempt connection once
  if (connectionAttempted) {
    return redisClient;
  }
  connectionAttempted = true;

  // Skip Redis if REDIS_URL is not configured
  if (!process.env.REDIS_URL) {
    console.log("[Redis] REDIS_URL not configured, running without Redis");
    return null;
  }

  try {
    const redisUrl = process.env.REDIS_URL;

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // Disable retries - don't keep trying if Redis is down
      enableReadyCheck: false,
      lazyConnect: true,
      connectTimeout: 5000, // 5 second timeout
      showFriendlyErrorStack: false,
    });

    // Handle error events silently after initial connection attempt
    redisClient.on("error", () => {
      // Silently ignore errors after initial log
      if (isRedisConnected) {
        isRedisConnected = false;
        console.log("[Redis] Connection lost");
      }
    });

    redisClient.on("close", () => {
      isRedisConnected = false;
    });

    redisClient.on("connect", () => {
      isRedisConnected = true;
    });

    // Attempt to connect with timeout
    await redisClient.connect();

    // Test connection
    await redisClient.ping();
    isRedisConnected = true;
    console.log("[Redis] Connected successfully");

    return redisClient;
  } catch (error) {
    console.log("[Redis] Not available, running without cache");
    isRedisConnected = false;

    // Disconnect and cleanup to prevent retry attempts
    if (redisClient) {
      try {
        redisClient.disconnect(false);
      } catch (e) {
        // Ignore disconnect errors
      }
      redisClient = null;
    }

    return null;
  }
};

/**
 * Get Redis client instance
 */
const getRedisClient = () => redisClient;

/**
 * Check if Redis is connected
 */
const isConnected = () => isRedisConnected;

/**
 * Cache TTL constants (in seconds)
 */
const CACHE_TTL = {
  ORGANIZATION: 300, // 5 minutes
  ORGANIZATION_LIST: 60, // 1 minute
  SHORT: 30, // 30 seconds
};

/**
 * Generate cache key for organization
 */
const orgCacheKey = (orgName) => `org:${orgName.toLowerCase()}`;

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {Promise<object|null>} - Cached data or null
 */
const getCache = async (key) => {
  if (!isRedisConnected || !redisClient) return null;

  try {
    const data = await redisClient.get(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Set cached data
 * @param {string} key - Cache key
 * @param {object} data - Data to cache
 * @param {number} ttl - Time to live in seconds
 */
const setCache = async (key, data, ttl = CACHE_TTL.ORGANIZATION) => {
  if (!isRedisConnected || !redisClient) return false;

  try {
    await redisClient.setex(key, ttl, JSON.stringify(data));
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Delete cached data
 * @param {string} key - Cache key
 */
const deleteCache = async (key) => {
  if (!isRedisConnected || !redisClient) return false;

  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Delete cache by pattern
 * @param {string} pattern - Key pattern (e.g., "org:*")
 */
const deleteCachePattern = async (pattern) => {
  if (!isRedisConnected || !redisClient) return false;

  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Get Redis stats for health monitoring
 */
const getRedisStats = async () => {
  if (!isRedisConnected || !redisClient) {
    return { connected: false, status: "disconnected" };
  }

  try {
    const info = await redisClient.info("stats");
    const memory = await redisClient.info("memory");

    return {
      connected: true,
      status: "connected",
      stats: {
        uptime: info.match(/uptime_in_seconds:(\d+)/)?.[1] || "unknown",
        connectedClients:
          info.match(/connected_clients:(\d+)/)?.[1] || "unknown",
        usedMemory: memory.match(/used_memory_human:(\S+)/)?.[1] || "unknown",
      },
    };
  } catch (error) {
    return { connected: false, status: "error", error: error.message };
  }
};

module.exports = {
  connectRedis,
  getRedisClient,
  isConnected,
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  orgCacheKey,
  getRedisStats,
  CACHE_TTL,
};
