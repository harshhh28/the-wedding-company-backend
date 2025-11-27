/**
 * Request Logging Middleware
 * Logs all incoming requests for monitoring and debugging
 */

const morgan = require("morgan");

/**
 * Custom token for response time in a cleaner format
 */
morgan.token("response-time-ms", (req, res) => {
  const time = morgan["response-time"](req, res);
  return time ? `${parseFloat(time).toFixed(2)}ms` : "-";
});

/**
 * Custom token for request body (sanitized - no passwords)
 */
morgan.token("body", (req) => {
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitized = { ...req.body };
    // Remove sensitive fields
    if (sanitized.password) sanitized.password = "[REDACTED]";
    if (sanitized.password_hash) sanitized.password_hash = "[REDACTED]";
    return JSON.stringify(sanitized);
  }
  return "-";
});

/**
 * Custom token for worker ID in cluster mode
 */
morgan.token("worker", () => {
  const cluster = require("cluster");
  if (cluster.isWorker) {
    return `W${cluster.worker.id}`;
  }
  return "M";
});

/**
 * Development format - colorful and detailed
 */
const devFormat =
  ":method :url :status :response-time-ms - :res[content-length] bytes";

/**
 * Production format - structured for log aggregation
 */
const prodFormat = JSON.stringify({
  worker: ":worker",
  method: ":method",
  url: ":url",
  status: ":status",
  responseTime: ":response-time-ms",
  contentLength: ":res[content-length]",
  userAgent: ":user-agent",
  ip: ":remote-addr",
  timestamp: ":date[iso]",
});

/**
 * Create logger middleware based on environment
 */
const createLogger = () => {
  const isDev = process.env.NODE_ENV !== "production";

  // Skip logging for health checks in production
  const skip = (req) => {
    if (!isDev && req.url === "/health") return true;
    return false;
  };

  if (isDev) {
    return morgan(devFormat, {
      skip,
      stream: {
        write: (message) => console.log(`[HTTP] ${message.trim()}`),
      },
    });
  }

  return morgan(prodFormat, {
    skip,
    stream: {
      write: (message) => console.log(message.trim()),
    },
  });
};

/**
 * Request timing middleware
 * Adds timing information to response headers
 */
const requestTimer = (req, res, next) => {
  req.startTime = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - req.startTime;
    // Log slow requests (> 1 second)
    if (duration > 1000) {
      console.warn(
        `[SLOW REQUEST] ${req.method} ${req.originalUrl} took ${duration}ms`
      );
    }
  });

  next();
};

module.exports = {
  createLogger,
  requestTimer,
};
