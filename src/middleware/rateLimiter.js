/**
 * Redis-based Rate Limiting Middleware
 * Falls back to no rate limiting if Redis is unavailable
 */

const { getRedisClient, isConnected } = require("../config/redis");
const { errorResponse } = require("../utils/response");

/**
 * Rate limit configurations
 */
const RATE_LIMITS = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    keyPrefix: "rl:auth:",
    message: "Too many login attempts, please try again later",
  },
  create: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    keyPrefix: "rl:create:",
    message: "Too many organizations created, please try again later",
  },
  read: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    keyPrefix: "rl:read:",
    message: "Too many requests, please try again later",
  },
  general: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    keyPrefix: "rl:general:",
    message: "Too many requests, please try again later",
  },
};

/**
 * Get client identifier (IP address)
 */
const getClientKey = (req) => {
  return (
    req.ip ||
    req.headers["x-forwarded-for"]?.split(",")[0] ||
    req.connection?.remoteAddress ||
    "unknown"
  );
};

/**
 * Create a Redis-based rate limiter middleware
 * @param {string} type - Rate limit type: 'auth', 'create', 'read', 'general'
 * @returns {Function} Express middleware
 */
const createRateLimiter = (type = "general") => {
  const config = RATE_LIMITS[type] || RATE_LIMITS.general;

  return async (req, res, next) => {
    // If Redis is not connected, skip rate limiting
    if (!isConnected()) {
      return next();
    }

    const redis = getRedisClient();
    if (!redis) {
      return next();
    }

    try {
      const clientKey = getClientKey(req);
      const key = `${config.keyPrefix}${clientKey}`;
      const windowSeconds = Math.floor(config.windowMs / 1000);

      // Get current count
      const current = await redis.get(key);
      const count = current ? parseInt(current, 10) : 0;

      // Set rate limit headers
      res.setHeader("X-RateLimit-Limit", config.max);
      res.setHeader(
        "X-RateLimit-Remaining",
        Math.max(0, config.max - count - 1)
      );

      if (count >= config.max) {
        // Get TTL for retry-after header
        const ttl = await redis.ttl(key);
        res.setHeader("X-RateLimit-Reset", Date.now() + ttl * 1000);
        res.setHeader("Retry-After", ttl);

        return errorResponse(
          res,
          config.message,
          "RATE_LIMIT_EXCEEDED",
          {
            retryAfter: `${Math.ceil(ttl / 60)} minutes`,
            limit: config.max,
            windowMs: config.windowMs,
          },
          429
        );
      }

      // Increment counter
      const multi = redis.multi();
      multi.incr(key);
      multi.expire(key, windowSeconds);
      await multi.exec();

      next();
    } catch (error) {
      // If Redis operation fails, allow the request through
      console.error("[RateLimiter] Error:", error.message);
      next();
    }
  };
};

/**
 * Pre-configured rate limiters
 */
const authLimiter = createRateLimiter("auth");
const createOrgLimiter = createRateLimiter("create");
const readLimiter = createRateLimiter("read");
const generalLimiter = createRateLimiter("general");

/**
 * Check if rate limiting is active
 */
const isRateLimitingActive = () => isConnected();

module.exports = {
  createRateLimiter,
  authLimiter,
  createOrgLimiter,
  readLimiter,
  generalLimiter,
  isRateLimitingActive,
  RATE_LIMITS,
};
