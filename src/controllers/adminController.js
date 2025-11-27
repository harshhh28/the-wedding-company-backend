const orgService = require("../services/orgService");
const { successResponse, errorResponse } = require("../utils/response");
const ERROR_CODES = require("../utils/errorCodes");
const { adminLoginSchema, validate } = require("../validators/orgValidator");

/**
 * Admin Controller
 * Handles HTTP requests for admin authentication
 */

/**
 * Admin Login
 * POST /admin/login
 */
const adminLogin = async (req, res) => {
  try {
    // Validate request body
    const validation = validate(adminLoginSchema, req.body);
    if (!validation.success) {
      return errorResponse(
        res,
        "Validation failed",
        ERROR_CODES.VALIDATION_ERROR,
        validation.errors,
        400
      );
    }

    // Authenticate admin
    const result = await orgService.adminLogin(validation.data);

    return successResponse(res, "Login successful", result, 200);
  } catch (error) {
    console.error("Admin Login Error:", error.message);

    if (error.code === "INVALID_CREDENTIALS") {
      return errorResponse(
        res,
        error.message,
        ERROR_CODES.INVALID_CREDENTIALS,
        {},
        401
      );
    }

    return errorResponse(
      res,
      "Login failed",
      ERROR_CODES.SERVER_ERROR,
      {},
      500
    );
  }
};

module.exports = {
  adminLogin,
};
