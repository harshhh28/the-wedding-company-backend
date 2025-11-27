const mongoose = require("mongoose");
const { getDatabase } = require("../config/database");

/**
 * Collection Service
 * Handles dynamic collection creation, migration, and deletion
 */

/**
 * Check if a collection exists
 * @param {string} collectionName - Name of the collection to check
 * @returns {Promise<boolean>} - True if collection exists
 */
const collectionExists = async (collectionName) => {
  try {
    const db = getDatabase();
    const collections = await db
      .listCollections({ name: collectionName })
      .toArray();
    return collections.length > 0;
  } catch (error) {
    console.error(`Failed to check collection existence: ${error.message}`);
    throw error;
  }
};

/**
 * Generate collection name from organization name
 * @param {string} organizationName - Organization name
 * @returns {string} - Collection name in format org_<name>
 */
const generateCollectionName = (organizationName) => {
  return `org_${organizationName.toLowerCase().replace(/[^a-z0-9_-]/g, "_")}`;
};

/**
 * Create a new dynamic collection for an organization
 * @param {string} collectionName - Name of the collection to create
 * @returns {Promise<object>} - Created collection info
 */
const createCollection = async (collectionName) => {
  try {
    const db = getDatabase();

    // Check if collection already exists
    if (await collectionExists(collectionName)) {
      throw new Error(`Collection ${collectionName} already exists`);
    }

    // Create the collection
    await db.createCollection(collectionName);

    console.log(`Collection created: ${collectionName}`);
    return { name: collectionName, created: true };
  } catch (error) {
    console.error(`Failed to create collection: ${error.message}`);
    throw error;
  }
};

/**
 * Delete a dynamic collection
 * @param {string} collectionName - Name of the collection to delete
 * @returns {Promise<boolean>} - True if deleted successfully
 */
const deleteCollection = async (collectionName) => {
  try {
    const db = getDatabase();

    // Check if collection exists
    if (!(await collectionExists(collectionName))) {
      console.log(
        `Collection ${collectionName} does not exist, skipping deletion`
      );
      return true;
    }

    // Drop the collection
    await db.dropCollection(collectionName);

    console.log(`Collection deleted: ${collectionName}`);
    return true;
  } catch (error) {
    console.error(`Failed to delete collection: ${error.message}`);
    throw error;
  }
};

/**
 * Migrate data from one collection to another
 * @param {string} oldCollectionName - Source collection name
 * @param {string} newCollectionName - Destination collection name
 * @returns {Promise<object>} - Migration result with document count
 */
const migrateCollection = async (oldCollectionName, newCollectionName) => {
  try {
    const db = getDatabase();

    // Get old collection
    const oldCollection = db.collection(oldCollectionName);

    // Fetch all documents from old collection
    const documents = await oldCollection.find({}).toArray();

    // Create new collection
    await createCollection(newCollectionName);

    // If there are documents, insert them into new collection
    if (documents.length > 0) {
      const newCollection = db.collection(newCollectionName);
      await newCollection.insertMany(documents);
    }

    // Delete old collection
    await deleteCollection(oldCollectionName);

    console.log(
      `Migration complete: ${oldCollectionName} -> ${newCollectionName}, ${documents.length} documents migrated`
    );

    return {
      oldCollection: oldCollectionName,
      newCollection: newCollectionName,
      documentsMigrated: documents.length,
    };
  } catch (error) {
    console.error(`Failed to migrate collection: ${error.message}`);
    throw error;
  }
};

module.exports = {
  generateCollectionName,
  collectionExists,
  createCollection,
  deleteCollection,
  migrateCollection,
};
