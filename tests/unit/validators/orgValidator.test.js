/**
 * Unit Tests for Organization Validators
 */

const {
  createOrgSchema,
  updateOrgSchema,
  deleteOrgSchema,
  adminLoginSchema,
  validate,
} = require("../../../src/validators/orgValidator");

describe("Organization Validators", () => {
  describe("createOrgSchema", () => {
    it("should validate correct input", () => {
      const result = validate(createOrgSchema, {
        organization_name: "test-org",
        email: "admin@test.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should reject short organization name", () => {
      const result = validate(createOrgSchema, {
        organization_name: "a",
        email: "admin@test.com",
        password: "password123",
      });

      expect(result.success).toBe(false);
      expect(result.errors.organization_name).toBeDefined();
    });

    it("should reject invalid email", () => {
      const result = validate(createOrgSchema, {
        organization_name: "test-org",
        email: "invalid-email",
        password: "password123",
      });

      expect(result.success).toBe(false);
      expect(result.errors.email).toBeDefined();
    });

    it("should reject short password", () => {
      const result = validate(createOrgSchema, {
        organization_name: "test-org",
        email: "admin@test.com",
        password: "123",
      });

      expect(result.success).toBe(false);
      expect(result.errors.password).toBeDefined();
    });

    it("should reject special characters in organization name", () => {
      const result = validate(createOrgSchema, {
        organization_name: "test@org!",
        email: "admin@test.com",
        password: "password123",
      });

      expect(result.success).toBe(false);
    });
  });

  describe("updateOrgSchema", () => {
    it("should validate with only organization_name", () => {
      const result = validate(updateOrgSchema, {
        organization_name: "test-org",
      });

      expect(result.success).toBe(true);
    });

    it("should validate with optional new_organization_name", () => {
      const result = validate(updateOrgSchema, {
        organization_name: "test-org",
        new_organization_name: "new-org",
      });

      expect(result.success).toBe(true);
    });

    it("should validate with optional email", () => {
      const result = validate(updateOrgSchema, {
        organization_name: "test-org",
        email: "newemail@test.com",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("deleteOrgSchema", () => {
    it("should validate with organization_name", () => {
      const result = validate(deleteOrgSchema, {
        organization_name: "test-org",
      });

      expect(result.success).toBe(true);
    });

    it("should reject missing organization_name", () => {
      const result = validate(deleteOrgSchema, {});

      expect(result.success).toBe(false);
    });
  });

  describe("adminLoginSchema", () => {
    it("should validate correct credentials", () => {
      const result = validate(adminLoginSchema, {
        email: "admin@test.com",
        password: "password123",
      });

      expect(result.success).toBe(true);
    });

    it("should reject missing email", () => {
      const result = validate(adminLoginSchema, {
        password: "password123",
      });

      expect(result.success).toBe(false);
    });

    it("should reject missing password", () => {
      const result = validate(adminLoginSchema, {
        email: "admin@test.com",
      });

      expect(result.success).toBe(false);
    });
  });
});
