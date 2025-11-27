/**
 * Integration Tests for Health API
 */

const request = require("supertest");
const app = require("../../src/app");

describe("Health API", () => {
  describe("GET /health", () => {
    it("should return healthy status", async () => {
      const res = await request(app).get("/health");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("Server is running");
      expect(res.body.data.status).toBe("healthy");
      expect(res.body.data.timestamp).toBeDefined();
    });
  });

  describe("GET /health/detailed", () => {
    it("should return detailed health information", async () => {
      const res = await request(app).get("/health/detailed");

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("healthy");
      expect(res.body.data.uptime).toBeDefined();
      expect(res.body.data.services).toBeDefined();
      expect(res.body.data.services.mongodb).toBeDefined();
      expect(res.body.data.memory).toBeDefined();
      expect(res.body.data.system).toBeDefined();
    });

    it("should show mongodb as connected", async () => {
      const res = await request(app).get("/health/detailed");

      expect(res.body.data.services.mongodb.connected).toBe(true);
      expect(res.body.data.services.mongodb.status).toBe("connected");
    });
  });

  describe("GET /health/live", () => {
    it("should return alive status", async () => {
      const res = await request(app).get("/health/live");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("alive");
    });
  });

  describe("GET /health/ready", () => {
    it("should return ready status when MongoDB is connected", async () => {
      const res = await request(app).get("/health/ready");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe("ready");
    });
  });
});
