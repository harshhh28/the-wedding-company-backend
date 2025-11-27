const jwt = require("jsonwebtoken");
const { errorResponse } = require("../utils/response");
const ERROR_CODES = require("../utils/errorCodes");

/**
 * Auth Middleware
 * Verifies JWT token and attaches admin info to request
 */

/**
 * Authenticate JWT token
 * Extracts admin_id and organization_name from token
 * Attaches to req.admin
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return errorResponse(
        res,
        "Authorization token is required",
        ERROR_CODES.TOKEN_MISSING,
        {},
        401
      );
    }

    // Check Bearer token format
    if (!authHeader.startsWith("Bearer ")) {
      return errorResponse(
        res,
        "Invalid authorization format. Use: Bearer <token>",
        ERROR_CODES.TOKEN_INVALID,
        {},
        401
      );
    }

    // Extract token
    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach admin info to request
    req.admin = {
      admin_id: decoded.admin_id,
      organization_name: decoded.organization_name,
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);

    if (error.name === "TokenExpiredError") {
      return errorResponse(
        res,
        "Token has expired",
        ERROR_CODES.TOKEN_EXPIRED,
        {},
        401
      );
    }

    if (error.name === "JsonWebTokenError") {
      return errorResponse(
        res,
        "Invalid token",
        ERROR_CODES.TOKEN_INVALID,
        {},
        401
      );
    }

    return errorResponse(
      res,
      "Authentication failed",
      ERROR_CODES.UNAUTHORIZED,
      {},
      401
    );
  }
};

module.exports = {
  authenticate,
};
