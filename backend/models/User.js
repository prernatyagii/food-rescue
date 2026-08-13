const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: {
      type: String,
      enum: ["host", "ngo", "volunteer", "admin"],
      required: true,
    },

    // Geolocation (GeoJSON Point) — used for radius-based matching
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        // [longitude, latitude]
        type: [Number],
        default: [0, 0],
      },
      address: { type: String, default: "" },
    },

    // Only relevant for role = "ngo"
    ngoDetails: {
      orgName: { type: String },
      registrationNumber: { type: String },
      documentUrl: { type: String },
    },

    // NGOs and Volunteers must be verified by an Admin before they can act
    isVerified: {
      type: Boolean,
      default: function () {
        return this.role === "host" || this.role === "admin";
      },
    },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
