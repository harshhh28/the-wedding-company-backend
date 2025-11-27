const mongoose = require("mongoose");

/**
 * Connect to MongoDB Master Database
 */

const connectDatabase = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {});
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Database Connection Error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Get the MongoDB database instance
 * Used for dynamic collection operations
 */
const getDatabase = () => {
  return mongoose.connection.db;
};

module.exports = {
  connectDatabase,
  getDatabase,
};
