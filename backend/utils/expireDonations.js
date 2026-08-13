const Donation = require("../models/Donation");

// Any donation still "pending" past its expiresAt (best-before) time is
// moved to "expired" so it silently drops out of NGOs' Available Food
// list. Donations already claimed (accepted/assigned/etc.) are left
// alone — expiry only applies to unclaimed posts.
const sweepExpiredDonations = async () => {
  try {
    const result = await Donation.updateMany(
      { status: "pending", expiresAt: { $lt: new Date() } },
      { status: "expired" }
    );
    if (result.modifiedCount > 0) {
      console.log(`[expiry-sweep] marked ${result.modifiedCount} donation(s) as expired`);
    }
  } catch (err) {
    console.error("[expiry-sweep] failed:", err.message);
  }
};

// Runs once immediately, then on a fixed interval (default every 5 min)
const startExpirySweep = (intervalMs = 5 * 60 * 1000) => {
  sweepExpiredDonations();
  setInterval(sweepExpiredDonations, intervalMs);
};

module.exports = { sweepExpiredDonations, startExpirySweep };
