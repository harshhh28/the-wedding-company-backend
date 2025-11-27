/**
 * Unit Tests for Collection Service
 */

const {
  generateCollectionName,
  createCollection,
  deleteCollection,
  collectionExists,
} = require("../../../src/services/collectionService");

describe("Collection Service", () => {
  describe("generateCollectionName", () => {
    it("should generate collection name with org_ prefix", () => {
      const result = generateCollectionName("test-company");
      expect(result).toBe("org_test-company");
    });

    it("should convert to lowercase", () => {
      const result = generateCollectionName("TEST-COMPANY");
      expect(result).toBe("org_test-company");
    });

    it("should replace special characters with underscores", () => {
      const result = generateCollectionName("test@company.com");
      expect(result).toBe("org_test_company_com");
    });

    it("should handle spaces", () => {
      const result = generateCollectionName("test company");
      expect(result).toBe("org_test_company");
    });
  });

  describe("createCollection", () => {
    it("should create a new collection", async () => {
      const collectionName = "org_test_create";
      const result = await createCollection(collectionName);

      expect(result.name).toBe(collectionName);
      expect(result.created).toBe(true);
    });

    it("should throw error if collection already exists", async () => {
      const collectionName = "org_duplicate_test";
      await createCollection(collectionName);

      await expect(createCollection(collectionName)).rejects.toThrow();
    });
  });

  describe("collectionExists", () => {
    it("should return true if collection exists", async () => {
      const collectionName = "org_exists_test";
      await createCollection(collectionName);

      const result = await collectionExists(collectionName);
      expect(result).toBe(true);
    });

    it("should return false if collection does not exist", async () => {
      const result = await collectionExists("org_nonexistent");
      expect(result).toBe(false);
    });
  });

  describe("deleteCollection", () => {
    it("should delete existing collection", async () => {
      const collectionName = "org_delete_test";
      await createCollection(collectionName);

      const result = await deleteCollection(collectionName);
      expect(result).toBe(true);

      // Verify deletion
      const exists = await collectionExists(collectionName);
      expect(exists).toBe(false);
    });

    it("should return true for non-existent collection (idempotent)", async () => {
      const result = await deleteCollection("org_nonexistent");
      expect(result).toBe(true);
    });
  });
});
