const User = require("../models/User");
const Donation = require("../models/Donation");

// GET /api/admin/pending-verifications
const getPendingVerifications = async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ["ngo", "volunteer"] }, isVerified: false }).select("-password");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/verify/:userId
const verifyUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { isVerified: true }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/admin/deactivate/:userId — dispute resolution / trust & safety
const deactivateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { isActive: false }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/users
const getAllUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter).select("-password").sort("-createdAt");
    res.json({ users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/admin/donations — full donation list for oversight/disputes
const getAllDonations = async (req, res) => {
  try {
    const donations = await Donation.find({})
      .populate("host", "name phone")
      .populate("ngo", "name")
      .populate("volunteer", "name")
      .sort("-createdAt");
    res.json({ donations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getPendingVerifications, verifyUser, deactivateUser, getAllUsers, getAllDonations };
