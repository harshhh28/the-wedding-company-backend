/**
 * Standard API Response Utility
 * All API responses must use these functions to maintain consistency
 */

/**
 * Send a success response
 * @param {object} res - Express response object
 * @param {string} message - Human readable success message
 * @param {object} data - API specific response payload
 * @param {number} statusCode - HTTP status code (default: 200)
 */
const successResponse = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Send an error response
 * @param {object} res - Express response object
 * @param {string} message - Human readable error message
 * @param {string} code - Error identifier code
 * @param {object} details - Optional extra error details
 * @param {number} statusCode - HTTP status code (default: 500)
 */
const errorResponse = (res, message, code, details = {}, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      details
    }
  });
};

module.exports = {
  successResponse,
  errorResponse
};

