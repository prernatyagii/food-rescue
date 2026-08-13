const Feedback = require("../models/Feedback");
const Donation = require("../models/Donation");

// POST /api/feedback  — leave feedback on a completed donation
// body: { donationId, to, rating, comment }
const createFeedback = async (req, res) => {
  try {
    const { donationId, to, rating, comment } = req.body;
    if (!donationId || !to || !rating) {
      return res.status(400).json({ message: "donationId, to and rating are required" });
    }

    const donation = await Donation.findById(donationId);
    if (!donation) return res.status(404).json({ message: "Donation not found" });
    if (donation.status !== "delivered") {
      return res.status(400).json({ message: "Feedback is only allowed once a donation is delivered" });
    }

    // Only participants in this donation can leave feedback about each other
    const participants = [String(donation.host), String(donation.ngo), String(donation.volunteer)];
    if (!participants.includes(String(req.user._id)) || !participants.includes(String(to))) {
      return res.status(403).json({ message: "You can only give feedback to people involved in this donation" });
    }

    const feedback = await Feedback.findOneAndUpdate(
      { donation: donationId, from: req.user._id, to },
      { rating, comment: comment || "" },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({ feedback });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/feedback/for/:userId — feedback someone has received (e.g. for a profile/reputation view)
const getFeedbackForUser = async (req, res) => {
  try {
    const feedback = await Feedback.find({ to: req.params.userId })
      .populate("from", "name role")
      .populate("donation", "foodType")
      .sort("-createdAt");
    res.json({ feedback });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/feedback/donation/:donationId — feedback already left for a specific donation (so UI can hide the form once submitted)
const getFeedbackForDonation = async (req, res) => {
  try {
    const feedback = await Feedback.find({ donation: req.params.donationId, from: req.user._id });
    res.json({ feedback });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createFeedback, getFeedbackForUser, getFeedbackForDonation };
