/**
 * Health Controller
 * Provides system health and monitoring endpoints
 */

const mongoose = require("mongoose");
const {
  getRedisStats,
  isConnected: isRedisConnected,
} = require("../config/redis");
const os = require("os");
const cluster = require("cluster");

/**
 * Basic health check
 * GET /health
 */
const healthCheck = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
  });
};

/**
 * Detailed health check with system stats
 * GET /health/detailed
 */
const detailedHealthCheck = async (req, res) => {
  try {
    // MongoDB status
    const mongoStatus = mongoose.connection.readyState;
    const mongoStates = {
      0: "disconnected",
      1: "connected",
      2: "connecting",
      3: "disconnecting",
    };

    // Redis status
    const redisStats = await getRedisStats();

    // System metrics
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    // Worker info
    const workerInfo = cluster.isWorker
      ? { id: cluster.worker.id, pid: process.pid }
      : { id: "master", pid: process.pid };

    const healthData = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: Math.floor(uptime),
        formatted: formatUptime(uptime),
      },
      worker: workerInfo,
      services: {
        mongodb: {
          status: mongoStates[mongoStatus] || "unknown",
          connected: mongoStatus === 1,
        },
        redis: {
          status: redisStats.status,
          connected: redisStats.connected,
          ...(redisStats.stats && { stats: redisStats.stats }),
        },
      },
      memory: {
        heapUsed: formatBytes(memoryUsage.heapUsed),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        rss: formatBytes(memoryUsage.rss),
        external: formatBytes(memoryUsage.external),
      },
      system: {
        platform: os.platform(),
        cpus: os.cpus().length,
        totalMemory: formatBytes(os.totalmem()),
        freeMemory: formatBytes(os.freemem()),
        loadAverage: os.loadavg().map((load) => load.toFixed(2)),
      },
    };

    // Determine overall health
    const isHealthy =
      mongoStatus === 1 && (redisStats.connected || !process.env.REDIS_URL);

    res.status(isHealthy ? 200 : 503).json({
      success: isHealthy,
      message: isHealthy ? "All systems operational" : "Some services degraded",
      data: healthData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Health check failed",
      error: {
        code: "HEALTH_CHECK_ERROR",
        details: { message: error.message },
      },
    });
  }
};

/**
 * Liveness probe for Kubernetes
 * GET /health/live
 */
const livenessProbe = (req, res) => {
  res.status(200).json({
    success: true,
    message: "alive",
    data: { timestamp: new Date().toISOString() },
  });
};

/**
 * Readiness probe for Kubernetes
 * GET /health/ready
 */
const readinessProbe = async (req, res) => {
  const mongoConnected = mongoose.connection.readyState === 1;

  if (mongoConnected) {
    res.status(200).json({
      success: true,
      message: "ready",
      data: { timestamp: new Date().toISOString() },
    });
  } else {
    res.status(503).json({
      success: false,
      message: "not ready",
      error: {
        code: "NOT_READY",
        details: { mongodb: "disconnected" },
      },
    });
  }
};

/**
 * Format bytes to human readable string
 */
const formatBytes = (bytes) => {
  const units = ["B", "KB", "MB", "GB"];
  let unitIndex = 0;
  let value = bytes;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }

  return `${value.toFixed(2)} ${units[unitIndex]}`;
};

/**
 * Format uptime to human readable string
 */
const formatUptime = (seconds) => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(" ");
};

module.exports = {
  healthCheck,
  detailedHealthCheck,
  livenessProbe,
  readinessProbe,
};
