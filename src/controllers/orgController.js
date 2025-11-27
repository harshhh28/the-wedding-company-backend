const orgService = require("../services/orgService");
const { successResponse, errorResponse } = require("../utils/response");
const ERROR_CODES = require("../utils/errorCodes");
const {
  createOrgSchema,
  updateOrgSchema,
  deleteOrgSchema,
  validate,
} = require("../validators/orgValidator");

/**
 * Organization Controller
 * Handles HTTP requests for organization operations
 */

/**
 * Create Organization
 * POST /org/create
 */
const createOrganization = async (req, res) => {
  try {
    // Validate request body
    const validation = validate(createOrgSchema, req.body);
    if (!validation.success) {
      return errorResponse(
        res,
        "Validation failed",
        ERROR_CODES.VALIDATION_ERROR,
        validation.errors,
        400
      );
    }

    // Create organization
    const organization = await orgService.createOrganization(validation.data);

    return successResponse(
      res,
      "Organization created successfully",
      organization,
      201
    );
  } catch (error) {
    console.error("Create Organization Error:", error.message);

    if (error.code === "ORG_ALREADY_EXISTS") {
      return errorResponse(
        res,
        error.message,
        ERROR_CODES.ORG_ALREADY_EXISTS,
        {},
        409
      );
    }

    return errorResponse(
      res,
      "Failed to create organization",
      ERROR_CODES.SERVER_ERROR,
      {},
      500
    );
  }
};

/**
 * Get Organization
 * GET /org/get?organization_name=<name>
 */
const getOrganization = async (req, res) => {
  try {
    const { organization_name } = req.query;

    if (!organization_name) {
      return errorResponse(
        res,
        "Organization name is required",
        ERROR_CODES.ORG_NAME_REQUIRED,
        {},
        400
      );
    }

    const organization = await orgService.getOrganization(organization_name);

    return successResponse(
      res,
      "Organization retrieved successfully",
      organization,
      200
    );
  } catch (error) {
    console.error("Get Organization Error:", error.message);

    if (error.code === "ORG_NOT_FOUND") {
      return errorResponse(
        res,
        error.message,
        ERROR_CODES.ORG_NOT_FOUND,
        {},
        404
      );
    }

    return errorResponse(
      res,
      "Failed to retrieve organization",
      ERROR_CODES.SERVER_ERROR,
      {},
      500
    );
  }
};

/**
 * Update Organization
 * PUT /org/update
 * Requires authentication
 */
const updateOrganization = async (req, res) => {
  try {
    // Validate request body
    const validation = validate(updateOrgSchema, req.body);
    if (!validation.success) {
      return errorResponse(
        res,
        "Validation failed",
        ERROR_CODES.VALIDATION_ERROR,
        validation.errors,
        400
      );
    }

    // Check if the authenticated admin belongs to this organization
    if (
      req.admin.organization_name !==
      validation.data.organization_name.toLowerCase()
    ) {
      return errorResponse(
        res,
        "You are not authorized to update this organization",
        ERROR_CODES.UNAUTHORIZED,
        {},
        401
      );
    }

    // Update organization
    const organization = await orgService.updateOrganization(validation.data);

    return successResponse(
      res,
      "Organization updated successfully",
      organization,
      200
    );
  } catch (error) {
    console.error("Update Organization Error:", error.message);

    if (error.code === "ORG_NOT_FOUND") {
      return errorResponse(
        res,
        error.message,
        ERROR_CODES.ORG_NOT_FOUND,
        {},
        404
      );
    }

    if (error.code === "ORG_ALREADY_EXISTS") {
      return errorResponse(
        res,
        error.message,
        ERROR_CODES.ORG_ALREADY_EXISTS,
        {},
        409
      );
    }

    return errorResponse(
      res,
      "Failed to update organization",
      ERROR_CODES.SERVER_ERROR,
      {},
      500
    );
  }
};

/**
 * Delete Organization
 * DELETE /org/delete
 * Requires authentication
 */
const deleteOrganization = async (req, res) => {
  try {
    // Validate request body
    const validation = validate(deleteOrgSchema, req.body);
    if (!validation.success) {
      return errorResponse(
        res,
        "Validation failed",
        ERROR_CODES.VALIDATION_ERROR,
        validation.errors,
        400
      );
    }

    // Check if the authenticated admin belongs to this organization
    if (
      req.admin.organization_name !==
      validation.data.organization_name.toLowerCase()
    ) {
      return errorResponse(
        res,
        "You are not authorized to delete this organization",
        ERROR_CODES.UNAUTHORIZED,
        {},
        401
      );
    }

    // Delete organization
    const result = await orgService.deleteOrganization(
      validation.data.organization_name
    );

    return successResponse(
      res,
      "Organization deleted successfully",
      result,
      200
    );
  } catch (error) {
    console.error("Delete Organization Error:", error.message);

    if (error.code === "ORG_NOT_FOUND") {
      return errorResponse(
        res,
        error.message,
        ERROR_CODES.ORG_NOT_FOUND,
        {},
        404
      );
    }

    return errorResponse(
      res,
      "Failed to delete organization",
      ERROR_CODES.SERVER_ERROR,
      {},
      500
    );
  }
};

module.exports = {
  createOrganization,
  getOrganization,
  updateOrganization,
  deleteOrganization,
};
