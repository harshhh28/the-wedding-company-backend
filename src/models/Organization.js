const mongoose = require("mongoose");

/**
 * Organization Schema - Master Database Collection
 * Stores metadata for all organizations including admin credentials
 */
const organizationSchema = new mongoose.Schema(
  {
    organization_name: {
      type: String,
      required: [true, "Organization name is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    collection_name: {
      type: String,
      required: true,
      unique: true,
    },
    admin: {
      admin_id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
      },
      email: {
        type: String,
        required: [true, "Admin email is required"],
        unique: true,
        trim: true,
        lowercase: true,
      },
      password_hash: {
        type: String,
        required: [true, "Admin password is required"],
      },
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Indexes are automatically created by `unique: true` on schema fields:
// - organization_name (unique)
// - collection_name (unique)
// - admin.email (unique)

const Organization = mongoose.model("Organization", organizationSchema);

module.exports = Organization;
