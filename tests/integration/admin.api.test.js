/**
 * Integration Tests for Admin API
 */

const request = require("supertest");
const app = require("../../src/app");

describe("Admin API", () => {
  describe("POST /admin/login", () => {
    beforeEach(async () => {
      await request(app).post("/org/create").send({
        organization_name: "login-test-org",
        email: "admin@logintest.com",
        password: "password123",
      });
    });

    it("should login successfully with correct credentials", async () => {
      const res = await request(app).post("/admin/login").send({
        email: "admin@logintest.com",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Login successful");
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.admin.email).toBe("admin@logintest.com");
      expect(res.body.data.admin.organization_name).toBe("login-test-org");
    });

    it("should return 401 for wrong password", async () => {
      const res = await request(app).post("/admin/login").send({
        email: "admin@logintest.com",
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("should return 401 for non-existent email", async () => {
      const res = await request(app).post("/admin/login").send({
        email: "nonexistent@test.com",
        password: "password123",
      });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
    });

    it("should return 400 for invalid email format", async () => {
      const res = await request(app).post("/admin/login").send({
        email: "invalid-email",
        password: "password123",
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 for missing password", async () => {
      const res = await request(app).post("/admin/login").send({
        email: "admin@logintest.com",
      });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should be case-insensitive for email", async () => {
      const res = await request(app).post("/admin/login").send({
        email: "ADMIN@LOGINTEST.COM",
        password: "password123",
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
