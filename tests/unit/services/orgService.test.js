/**
 * Unit Tests for Organization Service
 */

const {
  organizationExists,
  organizationOrEmailExists,
  createOrganization,
  getOrganization,
  updateOrganization,
  deleteOrganization,
  adminLogin,
} = require("../../../src/services/orgService");
const Organization = require("../../../src/models/Organization");

describe("Organization Service", () => {
  describe("organizationExists", () => {
    it("should return true if organization exists", async () => {
      // Create an organization first
      await Organization.create({
        organization_name: "test-org",
        collection_name: "org_test-org",
        admin: {
          email: "admin@test.com",
          password_hash: "hashedpassword",
        },
      });

      const result = await organizationExists("test-org");
      expect(result).toBe(true);
    });

    it("should return false if organization does not exist", async () => {
      const result = await organizationExists("nonexistent-org");
      expect(result).toBe(false);
    });

    it("should be case-insensitive", async () => {
      await Organization.create({
        organization_name: "test-org",
        collection_name: "org_test-org",
        admin: {
          email: "admin@test.com",
          password_hash: "hashedpassword",
        },
      });

      const result = await organizationExists("TEST-ORG");
      expect(result).toBe(true);
    });
  });

  describe("organizationOrEmailExists", () => {
    beforeEach(async () => {
      await Organization.create({
        organization_name: "existing-org",
        collection_name: "org_existing-org",
        admin: {
          email: "existing@test.com",
          password_hash: "hashedpassword",
        },
      });
    });

    it("should return exists:false if neither exists", async () => {
      const result = await organizationOrEmailExists("new-org", "new@test.com");
      expect(result.exists).toBe(false);
    });

    it("should detect existing organization name", async () => {
      const result = await organizationOrEmailExists(
        "existing-org",
        "new@test.com"
      );
      expect(result.exists).toBe(true);
      expect(result.reason).toBe("organization_name");
    });

    it("should detect existing email", async () => {
      const result = await organizationOrEmailExists(
        "new-org",
        "existing@test.com"
      );
      expect(result.exists).toBe(true);
      expect(result.reason).toBe("email");
    });
  });

  describe("createOrganization", () => {
    it("should create a new organization successfully", async () => {
      const orgData = {
        organization_name: "new-company",
        email: "admin@newcompany.com",
        password: "password123",
      };

      const result = await createOrganization(orgData);

      expect(result.organization_name).toBe("new-company");
      expect(result.collection_name).toBe("org_new-company");
      expect(result.admin.email).toBe("admin@newcompany.com");
      expect(result.admin.admin_id).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.created_at).toBeDefined();
    });

    it("should throw error if organization name already exists", async () => {
      await createOrganization({
        organization_name: "duplicate-org",
        email: "first@test.com",
        password: "password123",
      });

      await expect(
        createOrganization({
          organization_name: "duplicate-org",
          email: "second@test.com",
          password: "password123",
        })
      ).rejects.toThrow("Organization with this name already exists");
    });

    it("should throw error if email already exists", async () => {
      await createOrganization({
        organization_name: "org-one",
        email: "duplicate@test.com",
        password: "password123",
      });

      await expect(
        createOrganization({
          organization_name: "org-two",
          email: "duplicate@test.com",
          password: "password123",
        })
      ).rejects.toThrow("Email is already registered");
    });

    it("should normalize organization name to lowercase", async () => {
      const result = await createOrganization({
        organization_name: "UPPERCASE-ORG",
        email: "admin@test.com",
        password: "password123",
      });

      expect(result.organization_name).toBe("uppercase-org");
    });
  });

  describe("getOrganization", () => {
    beforeEach(async () => {
      await createOrganization({
        organization_name: "get-test-org",
        email: "admin@gettest.com",
        password: "password123",
      });
    });

    it("should retrieve existing organization", async () => {
      const result = await getOrganization("get-test-org");

      expect(result.organization_name).toBe("get-test-org");
      expect(result.admin.email).toBe("admin@gettest.com");
    });

    it("should throw error if organization not found", async () => {
      await expect(getOrganization("nonexistent")).rejects.toThrow(
        "Organization not found"
      );
    });

    it("should be case-insensitive", async () => {
      const result = await getOrganization("GET-TEST-ORG");
      expect(result.organization_name).toBe("get-test-org");
    });
  });

  describe("updateOrganization", () => {
    let originalOrg;

    beforeEach(async () => {
      originalOrg = await createOrganization({
        organization_name: "update-test-org",
        email: "admin@updatetest.com",
        password: "password123",
      });
    });

    it("should update organization email", async () => {
      const result = await updateOrganization({
        organization_name: "update-test-org",
        email: "newemail@updatetest.com",
      });

      expect(result.admin.email).toBe("newemail@updatetest.com");
    });

    it("should update organization name", async () => {
      const result = await updateOrganization({
        organization_name: "update-test-org",
        new_organization_name: "renamed-org",
      });

      expect(result.organization_name).toBe("renamed-org");
      expect(result.collection_name).toBe("org_renamed-org");
    });

    it("should throw error if organization not found", async () => {
      await expect(
        updateOrganization({
          organization_name: "nonexistent",
          email: "new@test.com",
        })
      ).rejects.toThrow("Organization not found");
    });

    it("should throw error if new name already taken", async () => {
      await createOrganization({
        organization_name: "another-org",
        email: "another@test.com",
        password: "password123",
      });

      await expect(
        updateOrganization({
          organization_name: "update-test-org",
          new_organization_name: "another-org",
        })
      ).rejects.toThrow("Organization with this name already exists");
    });
  });

  describe("deleteOrganization", () => {
    beforeEach(async () => {
      await createOrganization({
        organization_name: "delete-test-org",
        email: "admin@deletetest.com",
        password: "password123",
      });
    });

    it("should delete existing organization", async () => {
      const result = await deleteOrganization("delete-test-org");

      expect(result.organization_name).toBe("delete-test-org");
      expect(result.deleted).toBe(true);

      // Verify it's actually deleted
      await expect(getOrganization("delete-test-org")).rejects.toThrow(
        "Organization not found"
      );
    });

    it("should throw error if organization not found", async () => {
      await expect(deleteOrganization("nonexistent")).rejects.toThrow(
        "Organization not found"
      );
    });
  });

  describe("adminLogin", () => {
    beforeEach(async () => {
      await createOrganization({
        organization_name: "login-test-org",
        email: "admin@logintest.com",
        password: "correctpassword",
      });
    });

    it("should login successfully with correct credentials", async () => {
      const result = await adminLogin({
        email: "admin@logintest.com",
        password: "correctpassword",
      });

      expect(result.token).toBeDefined();
      expect(result.admin.email).toBe("admin@logintest.com");
      expect(result.admin.organization_name).toBe("login-test-org");
    });

    it("should throw error for wrong password", async () => {
      await expect(
        adminLogin({
          email: "admin@logintest.com",
          password: "wrongpassword",
        })
      ).rejects.toThrow("Invalid email or password");
    });

    it("should throw error for nonexistent email", async () => {
      await expect(
        adminLogin({
          email: "nonexistent@test.com",
          password: "anypassword",
        })
      ).rejects.toThrow("Invalid email or password");
    });

    it("should be case-insensitive for email", async () => {
      const result = await adminLogin({
        email: "ADMIN@LOGINTEST.COM",
        password: "correctpassword",
      });

      expect(result.token).toBeDefined();
    });
  });
});
