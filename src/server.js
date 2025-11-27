require("dotenv").config();

const cluster = require("cluster");
const app = require("./app");
const { connectDatabase } = require("./config/database");
const { connectRedis } = require("./config/redis");

/**
 * Server Entry Point
 */

const PORT = process.env.PORT || 3000;

// Get worker info for logging
const getWorkerInfo = () => {
  if (cluster.isWorker) {
    return `[Worker ${process.pid}]`;
  }
  return `[PID ${process.pid}]`;
};

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();

    // Connect to Redis (optional - graceful fallback if unavailable)
    await connectRedis();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`\n${getWorkerInfo()} Organization Management Service`);
      console.log(`${getWorkerInfo()} Server running on port ${PORT}\n`);

      // Only show table for first worker or single process mode
      if (!cluster.isWorker || cluster.worker.id === 1) {
        console.table([
          {
            Method: "POST",
            Endpoint: "/org/create",
            Description: "Create organization",
          },
          {
            Method: "GET",
            Endpoint: "/org/get",
            Description: "Get organization",
          },
          {
            Method: "PUT",
            Endpoint: "/org/update",
            Description: "Update organization (protected)",
          },
          {
            Method: "DELETE",
            Endpoint: "/org/delete",
            Description: "Delete organization (protected)",
          },
          {
            Method: "POST",
            Endpoint: "/admin/login",
            Description: "Admin login",
          },
          {
            Method: "GET",
            Endpoint: "/health",
            Description: "Health check",
          },
          {
            Method: "GET",
            Endpoint: "/health/detailed",
            Description: "Detailed health + metrics",
          },
        ]);
      }
    });
  } catch (error) {
    console.error(`${getWorkerInfo()} Failed to start server:`, error.message);
    process.exit(1);
  }
};

startServer();
