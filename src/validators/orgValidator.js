const { z } = require("zod");

/**
 * Validation schemas using Zod
 */

// Create Organization Schema
const createOrgSchema = z.object({
  organization_name: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(50, "Organization name must be at most 50 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Organization name can only contain letters, numbers, underscores, and hyphens"
    ),
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be at most 100 characters"),
});

// Update Organization Schema
const updateOrgSchema = z.object({
  organization_name: z
    .string()
    .min(2, "Organization name must be at least 2 characters"),
  new_organization_name: z
    .string()
    .min(2, "New organization name must be at least 2 characters")
    .max(50, "New organization name must be at most 50 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Organization name can only contain letters, numbers, underscores, and hyphens"
    )
    .optional(),
  email: z.string().email("Invalid email format").optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must be at most 100 characters")
    .optional(),
});

// Delete Organization Schema
const deleteOrgSchema = z.object({
  organization_name: z.string().min(2, "Organization name is required"),
});

// Admin Login Schema
const adminLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Validate request body against schema
 * @param {object} schema - Zod schema
 * @param {object} data - Request body data
 * @returns {object} - { success: boolean, data?: object, errors?: object }
 */
const validate = (schema, data) => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    const errors = error.errors.reduce((acc, err) => {
      acc[err.path.join(".")] = err.message;
      return acc;
    }, {});
    return { success: false, errors };
  }
};

module.exports = {
  createOrgSchema,
  updateOrgSchema,
  deleteOrgSchema,
  adminLoginSchema,
  validate,
};
