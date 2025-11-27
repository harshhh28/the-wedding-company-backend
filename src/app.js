const express = require("express");
const orgRoutes = require("./routes/orgRoutes");
const adminRoutes = require("./routes/adminRoutes");
const healthRoutes = require("./routes/healthRoutes");
const { errorResponse } = require("./utils/response");
const ERROR_CODES = require("./utils/errorCodes");
const { createLogger, requestTimer } = require("./middleware/requestLogger");

const app = express();

// Trust proxy (needed for rate limiting behind reverse proxy)
app.set("trust proxy", 1);

// Request timing middleware
app.use(requestTimer);

// Request logging middleware
app.use(createLogger());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Routes (no rate limiting)
app.use("/health", healthRoutes);

// API Routes (rate limiting applied per-route via Redis)
app.use("/org", orgRoutes);
app.use("/admin", adminRoutes);

// 404 Handler
app.use((req, res) => {
  return errorResponse(
    res,
    "Resource not found",
    "NOT_FOUND",
    { path: req.originalUrl },
    404
  );
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("Unhandled Error:", err);

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return errorResponse(
      res,
      "Invalid JSON in request body",
      ERROR_CODES.VALIDATION_ERROR,
      {},
      400
    );
  }

  return errorResponse(
    res,
    "Internal server error",
    ERROR_CODES.SERVER_ERROR,
    {},
    500
  );
});

module.exports = app;
