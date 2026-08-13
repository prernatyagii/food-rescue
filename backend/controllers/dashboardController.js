const Donation = require("../models/Donation");
const User = require("../models/User");

// GET /api/dashboard/stats — powers the "Impact Dashboard" (Recharts on the frontend)
const getStats = async (req, res) => {
  try {
    const [deliveredAgg] = await Donation.aggregate([
      { $match: { status: "delivered" } },
      {
        $group: {
          _id: null,
          mealsSaved: { $sum: 1 },
          foodWasteReducedKg: { $sum: "$estimatedWeightKg" },
        },
      },
    ]);

    const totalDonations = await Donation.countDocuments();
    const activeNGOs = await User.countDocuments({ role: "ngo", isVerified: true });
    const activeVolunteers = await User.countDocuments({ role: "volunteer", isVerified: true });

    const statusBreakdown = await Donation.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    // Last 7 days of delivered donations, for a trend chart
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const trend = await Donation.aggregate([
      { $match: { status: "delivered", deliveredAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$deliveredAt" } },
          meals: { $sum: 1 },
          kg: { $sum: "$estimatedWeightKg" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      mealsSaved: deliveredAgg?.mealsSaved || 0,
      foodWasteReducedKg: deliveredAgg?.foodWasteReducedKg || 0,
      totalDonations,
      activeNGOs,
      activeVolunteers,
      statusBreakdown,
      trend,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getStats };
