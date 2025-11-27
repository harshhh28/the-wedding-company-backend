const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authLimiter } = require("../middleware/rateLimiter");

/**
 * Admin Routes
 * Login has strict rate limiting via Redis (disabled if Redis unavailable)
 */

// Admin login with strict rate limiting
router.post("/login", authLimiter, adminController.adminLogin);

module.exports = router;
