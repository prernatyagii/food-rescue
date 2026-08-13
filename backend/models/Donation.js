const mongoose = require("mongoose");

const donationSchema = new mongoose.Schema(
  {
    host: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    foodType: { type: String, required: true },
    quantity: { type: String, required: true }, // e.g. "15 kg" / "40 plates"
    description: { type: String, default: "" },
    photoUrl: { type: String, default: "" },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: { type: [Number], required: true }, // [lng, lat]
      address: { type: String, default: "" },
    },

    status: {
      type: String,
      enum: [
        "pending", // just posted, waiting for an NGO
        "accepted", // an NGO has claimed it (first-accept-wins)
        "assigned", // a volunteer has been assigned
        "picked_up", // volunteer collected it from host (OTP verified)
        "delivered", // volunteer delivered it to the NGO
        "cancelled",
        "expired",
      ],
      default: "pending",
    },

    ngo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    volunteer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

    // Pickup verification
    otp: { type: String, default: null },
    pickupPhotoUrl: { type: String, default: "" },

    // Simple numeric estimate used for the impact dashboard (kg)
    estimatedWeightKg: { type: Number, default: 5 },

    // Live volunteer location updates (lightweight — not a full history/collection)
    volunteerLocation: {
      coordinates: { type: [Number], default: [0, 0] },
      updatedAt: { type: Date },
    },

    acceptedAt: Date,
    assignedAt: Date,
    pickedUpAt: Date,
    deliveredAt: Date,
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

donationSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Donation", donationSchema);
