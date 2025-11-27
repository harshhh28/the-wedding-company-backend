/**
 * Jest Test Setup
 * Configures test environment with in-memory MongoDB
 */

const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

let mongoServer;

// Setup before all tests
beforeAll(async () => {
  // Create in-memory MongoDB instance
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  // Set environment variables for tests
  process.env.MONGODB_URI = mongoUri;
  process.env.JWT_SECRET = "test-jwt-secret-key";
  process.env.JWT_EXPIRES_IN = "1h";
  process.env.BCRYPT_SALT_ROUNDS = "4"; // Lower for faster tests
  process.env.NODE_ENV = "test";

  // Connect to in-memory database
  await mongoose.connect(mongoUri);
});

// Cleanup after each test
afterEach(async () => {
  // Drop ALL collections from the database directly
  // This ensures dynamic org_* collections created by collectionService are also removed
  const db = mongoose.connection.db;
  if (db) {
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      try {
        await db.dropCollection(collection.name);
      } catch (error) {
        // Collection might not exist, ignore
      }
    }
  }
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Mock Redis to always return null (disabled)
jest.mock("../src/config/redis", () => ({
  connectRedis: jest.fn().mockResolvedValue(null),
  getRedisClient: jest.fn().mockReturnValue(null),
  isConnected: jest.fn().mockReturnValue(false),
  getCache: jest.fn().mockResolvedValue(null),
  setCache: jest.fn().mockResolvedValue(false),
  deleteCache: jest.fn().mockResolvedValue(false),
  deleteCachePattern: jest.fn().mockResolvedValue(false),
  orgCacheKey: (name) => `org:${name.toLowerCase()}`,
  getRedisStats: jest
    .fn()
    .mockResolvedValue({ connected: false, status: "disconnected" }),
  CACHE_TTL: { ORGANIZATION: 300, ORGANIZATION_LIST: 60, SHORT: 30 },
}));
