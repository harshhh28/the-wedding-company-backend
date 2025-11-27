const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Organization = require("../models/Organization");
const collectionService = require("./collectionService");
const {
  getCache,
  setCache,
  deleteCache,
  orgCacheKey,
  CACHE_TTL,
} = require("../config/redis");

/**
 * Organization Service
 * Handles business logic for organization operations
 * Includes Redis caching for read operations
 */

/**
 * Check if an organization exists by name
 * @param {string} organizationName - Organization name to check
 * @returns {Promise<boolean>} - True if organization exists
 */
const organizationExists = async (organizationName) => {
  const org = await Organization.findOne({
    organization_name: organizationName.toLowerCase(),
  });
  return !!org;
};

/**
 * Check if an organization exists by name or admin email
 * @param {string} organizationName - Organization name to check
 * @param {string} email - Admin email to check
 * @returns {Promise<{exists: boolean, reason?: string}>} - Existence check result
 */
const organizationOrEmailExists = async (organizationName, email) => {
  const existingOrg = await Organization.findOne({
    $or: [
      { organization_name: organizationName.toLowerCase() },
      { "admin.email": email.toLowerCase() },
    ],
  });

  if (!existingOrg) {
    return { exists: false };
  }

  if (existingOrg.organization_name === organizationName.toLowerCase()) {
    return { exists: true, reason: "organization_name" };
  }

  if (existingOrg.admin.email === email.toLowerCase()) {
    return { exists: true, reason: "email" };
  }

  return { exists: true };
};

/**
 * Create a new organization
 * @param {object} orgData - Organization data { organization_name, email, password }
 * @returns {Promise<object>} - Created organization metadata
 */
const createOrganization = async ({ organization_name, email, password }) => {
  // Check if organization already exists
  const checkOrg = await organizationOrEmailExists(organization_name, email);

  if (checkOrg.exists) {
    const error = new Error(
      checkOrg.reason === "email"
        ? "Email is already registered"
        : "Organization with this name already exists"
    );
    error.code = "ORG_ALREADY_EXISTS";
    throw error;
  }

  // Generate collection name
  const collectionName =
    collectionService.generateCollectionName(organization_name);

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create organization document
  const organization = new Organization({
    organization_name: organization_name.toLowerCase(),
    collection_name: collectionName,
    admin: {
      email: email.toLowerCase(),
      password_hash: passwordHash,
    },
  });

  // Save to master database
  await organization.save();

  // Create dynamic collection
  await collectionService.createCollection(collectionName);

  // Prepare response data (without password hash)
  const orgData = {
    _id: organization._id,
    organization_name: organization.organization_name,
    collection_name: organization.collection_name,
    admin: {
      admin_id: organization.admin.admin_id,
      email: organization.admin.email,
    },
    created_at: organization.created_at,
    updated_at: organization.updated_at,
  };

  // Cache the new organization
  await setCache(
    orgCacheKey(organization.organization_name),
    orgData,
    CACHE_TTL.ORGANIZATION
  );

  return orgData;
};

/**
 * Get organization by name
 * Uses Redis cache for faster reads
 * @param {string} organizationName - Organization name
 * @returns {Promise<object>} - Organization metadata
 */
const getOrganization = async (organizationName) => {
  const cacheKey = orgCacheKey(organizationName);

  // Try to get from cache first
  const cachedOrg = await getCache(cacheKey);
  if (cachedOrg) {
    return cachedOrg;
  }

  // Cache miss - fetch from database
  const organization = await Organization.findOne({
    organization_name: organizationName.toLowerCase(),
  });

  if (!organization) {
    const error = new Error("Organization not found");
    error.code = "ORG_NOT_FOUND";
    throw error;
  }

  // Prepare response data (without password hash)
  const orgData = {
    _id: organization._id,
    organization_name: organization.organization_name,
    collection_name: organization.collection_name,
    admin: {
      admin_id: organization.admin.admin_id,
      email: organization.admin.email,
    },
    created_at: organization.created_at,
    updated_at: organization.updated_at,
  };

  // Cache the result
  await setCache(cacheKey, orgData, CACHE_TTL.ORGANIZATION);

  return orgData;
};

/**
 * Update organization
 * @param {object} updateData - Update data { organization_name, new_organization_name?, email?, password? }
 * @returns {Promise<object>} - Updated organization metadata
 */
const updateOrganization = async ({
  organization_name,
  new_organization_name,
  email,
  password,
}) => {
  // Find existing organization
  const organization = await Organization.findOne({
    organization_name: organization_name.toLowerCase(),
  });

  if (!organization) {
    const error = new Error("Organization not found");
    error.code = "ORG_NOT_FOUND";
    throw error;
  }

  const updates = {};
  let needsCollectionMigration = false;
  let newCollectionName = organization.collection_name;

  // Handle organization name change
  if (
    new_organization_name &&
    new_organization_name.toLowerCase() !== organization_name.toLowerCase()
  ) {
    // Check if new name is already taken
    const existingOrg = await Organization.findOne({
      organization_name: new_organization_name.toLowerCase(),
    });

    if (existingOrg) {
      const error = new Error("Organization with this name already exists");
      error.code = "ORG_ALREADY_EXISTS";
      throw error;
    }

    newCollectionName = collectionService.generateCollectionName(
      new_organization_name
    );
    updates.organization_name = new_organization_name.toLowerCase();
    updates.collection_name = newCollectionName;
    needsCollectionMigration = true;
  }

  // Handle email change
  if (email && email.toLowerCase() !== organization.admin.email) {
    // Check if email is already taken
    const existingOrg = await Organization.findOne({
      "admin.email": email.toLowerCase(),
    });

    if (existingOrg) {
      const error = new Error("Email is already registered");
      error.code = "ORG_ALREADY_EXISTS";
      throw error;
    }

    updates["admin.email"] = email.toLowerCase();
  }

  // Handle password change
  if (password) {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    updates["admin.password_hash"] = await bcrypt.hash(password, saltRounds);
  }

  // If no updates, return current organization
  if (Object.keys(updates).length === 0) {
    return getOrganization(organization_name);
  }

  // Perform collection migration if needed
  if (needsCollectionMigration) {
    await collectionService.migrateCollection(
      organization.collection_name,
      newCollectionName
    );
  }

  // Invalidate old cache before update
  await deleteCache(orgCacheKey(organization_name));

  // Update organization in master database
  const updatedOrg = await Organization.findByIdAndUpdate(
    organization._id,
    { $set: updates },
    { new: true }
  );

  // Prepare response data
  const orgData = {
    _id: updatedOrg._id,
    organization_name: updatedOrg.organization_name,
    collection_name: updatedOrg.collection_name,
    admin: {
      admin_id: updatedOrg.admin.admin_id,
      email: updatedOrg.admin.email,
    },
    created_at: updatedOrg.created_at,
    updated_at: updatedOrg.updated_at,
  };

  // Cache the updated organization with new key
  await setCache(
    orgCacheKey(updatedOrg.organization_name),
    orgData,
    CACHE_TTL.ORGANIZATION
  );

  // If name changed, also delete old name cache
  if (needsCollectionMigration) {
    await deleteCache(orgCacheKey(organization_name));
  }

  return orgData;
};

/**
 * Delete organization
 * Invalidates cache on deletion
 * @param {string} organizationName - Organization name
 * @returns {Promise<object>} - Deletion confirmation
 */
const deleteOrganization = async (organizationName) => {
  const organization = await Organization.findOne({
    organization_name: organizationName.toLowerCase(),
  });

  if (!organization) {
    const error = new Error("Organization not found");
    error.code = "ORG_NOT_FOUND";
    throw error;
  }

  // Invalidate cache
  await deleteCache(orgCacheKey(organizationName));

  // Delete dynamic collection
  await collectionService.deleteCollection(organization.collection_name);

  // Delete organization from master database
  await Organization.findByIdAndDelete(organization._id);

  return {
    organization_name: organization.organization_name,
    deleted: true,
  };
};

/**
 * Admin login
 * @param {object} credentials - Login credentials { email, password }
 * @returns {Promise<object>} - JWT token and admin info
 */
const adminLogin = async ({ email, password }) => {
  // Find organization by admin email
  const organization = await Organization.findOne({
    "admin.email": email.toLowerCase(),
  });

  if (!organization) {
    const error = new Error("Invalid email or password");
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(
    password,
    organization.admin.password_hash
  );

  if (!isPasswordValid) {
    const error = new Error("Invalid email or password");
    error.code = "INVALID_CREDENTIALS";
    throw error;
  }

  // Generate JWT token
  const tokenPayload = {
    admin_id: organization.admin.admin_id,
    organization_name: organization.organization_name,
  };

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
  });

  return {
    token,
    admin: {
      admin_id: organization.admin.admin_id,
      email: organization.admin.email,
      organization_name: organization.organization_name,
    },
  };
};

module.exports = {
  organizationExists,
  organizationOrEmailExists,
  createOrganization,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  adminLogin,
};
