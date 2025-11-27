const express = require("express");
const router = express.Router();
const healthController = require("../controllers/healthController");

/**
 * Health Routes
 */

// Basic health check
router.get("/", healthController.healthCheck);

// Detailed health with system stats
router.get("/detailed", healthController.detailedHealthCheck);

// Kubernetes probes
router.get("/live", healthController.livenessProbe);
router.get("/ready", healthController.readinessProbe);

module.exports = router;
