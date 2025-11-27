const express = require("express");
const router = express.Router();
const orgController = require("../controllers/orgController");
const { authenticate } = require("../middleware/authMiddleware");
const {
  createOrgLimiter,
  readLimiter,
  generalLimiter,
} = require("../middleware/rateLimiter");

/**
 * Organization Routes
 * Rate limiting via Redis (gracefully disabled if Redis unavailable)
 */

// Public routes with rate limiting
router.post("/create", createOrgLimiter, orgController.createOrganization);
router.get("/get", readLimiter, orgController.getOrganization);

// Protected routes (require authentication + rate limiting)
router.put(
  "/update",
  generalLimiter,
  authenticate,
  orgController.updateOrganization
);
router.delete(
  "/delete",
  generalLimiter,
  authenticate,
  orgController.deleteOrganization
);

module.exports = router;
