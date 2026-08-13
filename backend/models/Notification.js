const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    donation: { type: mongoose.Schema.Types.ObjectId, ref: "Donation" },
    type: {
      type: String,
      enum: [
        "new_donation_nearby",
        "donation_accepted",
        "volunteer_assigned",
        "pickup_verified",
        "delivered",
      ],
      required: true,
    },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
