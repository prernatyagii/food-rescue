const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    donation: { type: mongoose.Schema.Types.ObjectId, ref: "Donation", required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who gave feedback
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // who it's about
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

feedbackSchema.index({ donation: 1, from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model("Feedback", feedbackSchema);
