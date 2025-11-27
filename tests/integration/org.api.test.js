/**
 * Integration Tests for Organization API
 */

const request = require("supertest");
const app = require("../../src/app");

describe("Organization API", () => {
  describe("POST /org/create", () => {
    it("should create a new organization", async () => {
      const res = await request(app).post("/org/create").send({
        organization_name: "test-company",
        email: "admin@testcompany.com",
        password: "password123",
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Organization created successfully");
      expect(res.body.data.organization_name).toBe("test-company");
      expect(res.body.data.collection_name).toBe("org_test-company");
      expect(res.body.data.admin.email).toBe("admin@testcompany.com");
    });

    it("should return 400 for invalid input", async () => {
      const res = await request(app).post("/org/create").send({
        organization_name: "a", // too short
        email: "invalid-email",
        password: "123", // too short
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 409 for duplicate organization", async () => {
      // Create first
      await request(app).post("/org/create").send({
        organization_name: "duplicate-org",
        email: "first@test.com",
        password: "password123",
      });

      // Try duplicate
      const res = await request(app).post("/org/create").send({
        organization_name: "duplicate-org",
        email: "second@test.com",
        password: "password123",
      });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ORG_ALREADY_EXISTS");
    });

    it("should return 409 for duplicate email", async () => {
      await request(app).post("/org/create").send({
        organization_name: "org-one",
        email: "duplicate@test.com",
        password: "password123",
      });

      const res = await request(app).post("/org/create").send({
        organization_name: "org-two",
        email: "duplicate@test.com",
        password: "password123",
      });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("ORG_ALREADY_EXISTS");
    });
  });

  describe("GET /org/get", () => {
    beforeEach(async () => {
      await request(app).post("/org/create").send({
        organization_name: "get-test-org",
        email: "admin@gettest.com",
        password: "password123",
      });
    });

    it("should get organization by name", async () => {
      const res = await request(app)
        .get("/org/get")
        .query({ organization_name: "get-test-org" });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.organization_name).toBe("get-test-org");
    });

    it("should return 400 if organization_name not provided", async () => {
      const res = await request(app).get("/org/get");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("ORG_NAME_REQUIRED");
    });

    it("should return 404 for non-existent organization", async () => {
      const res = await request(app)
        .get("/org/get")
        .query({ organization_name: "nonexistent" });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("ORG_NOT_FOUND");
    });
  });

  describe("PUT /org/update", () => {
    let authToken;

    beforeEach(async () => {
      // Create organization
      await request(app).post("/org/create").send({
        organization_name: "update-test-org",
        email: "admin@updatetest.com",
        password: "password123",
      });

      // Login to get token
      const loginRes = await request(app).post("/admin/login").send({
        email: "admin@updatetest.com",
        password: "password123",
      });
      authToken = loginRes.body.data.token;
    });

    it("should update organization with valid token", async () => {
      const res = await request(app)
        .put("/org/update")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          organization_name: "update-test-org",
          email: "newemail@updatetest.com",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.admin.email).toBe("newemail@updatetest.com");
    });

    it("should return 401 without token", async () => {
      const res = await request(app).put("/org/update").send({
        organization_name: "update-test-org",
        email: "newemail@test.com",
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("TOKEN_MISSING");
    });

    it("should return 401 with invalid token", async () => {
      const res = await request(app)
        .put("/org/update")
        .set("Authorization", "Bearer invalid-token")
        .send({
          organization_name: "update-test-org",
          email: "newemail@test.com",
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("TOKEN_INVALID");
    });

    it("should return 401 when updating different organization", async () => {
      // Create another org
      await request(app).post("/org/create").send({
        organization_name: "other-org",
        email: "other@test.com",
        password: "password123",
      });

      const res = await request(app)
        .put("/org/update")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          organization_name: "other-org",
          email: "newemail@test.com",
        });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("DELETE /org/delete", () => {
    let authToken;

    beforeEach(async () => {
      await request(app).post("/org/create").send({
        organization_name: "delete-test-org",
        email: "admin@deletetest.com",
        password: "password123",
      });

      const loginRes = await request(app).post("/admin/login").send({
        email: "admin@deletetest.com",
        password: "password123",
      });
      authToken = loginRes.body.data.token;
    });

    it("should delete organization with valid token", async () => {
      const res = await request(app)
        .delete("/org/delete")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          organization_name: "delete-test-org",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.deleted).toBe(true);

      // Verify deletion
      const getRes = await request(app)
        .get("/org/get")
        .query({ organization_name: "delete-test-org" });
      expect(getRes.status).toBe(404);
    });

    it("should return 401 without token", async () => {
      const res = await request(app).delete("/org/delete").send({
        organization_name: "delete-test-org",
      });

      expect(res.status).toBe(401);
    });
  });
});
