const express = require("express");

const router = express.Router();

const {
  protect,
  authorize,
  requireVerified,
} = require("../middleware/auth");

const upload = require("../middleware/upload");

const ctrl = require("../controllers/donationController");

// ======================================================
// HOST
// Create a new food donation
// ======================================================
router.post(
  "/",
  protect,
  authorize("host"),
  upload.single("photo"),
  ctrl.createDonation
);

// ======================================================
// NGO
// Get nearby pending donations
// ======================================================
router.get(
  "/nearby",
  protect,
  authorize("ngo"),
  ctrl.getNearbyDonations
);

// ======================================================
// ALL ROLES
// Get my donations
// ======================================================
router.get(
  "/mine",
  protect,
  ctrl.getMyDonations
);

// ======================================================
// NGO
// Get available verified volunteers
// ======================================================
router.get(
  "/volunteers/available",
  protect,
  authorize("ngo"),
  requireVerified,
  ctrl.getAvailableVolunteers
);

// ======================================================
// SINGLE DONATION
// Get donation details
// ======================================================
router.get(
  "/:id",
  protect,
  ctrl.getDonationById
);

// ======================================================
// NGO
// Accept a pending donation
// ======================================================
router.put(
  "/:id/accept",
  protect,
  authorize("ngo"),
  requireVerified,
  ctrl.acceptDonation
);

// ======================================================
// NGO
// Assign volunteer to accepted donation
// ======================================================
router.put(
  "/:id/assign-volunteer",
  protect,
  authorize("ngo"),
  requireVerified,
  ctrl.assignVolunteer
);

// ======================================================
// VOLUNTEER
// Confirm assigned task
// Host will receive pickup OTP
// ======================================================
router.put(
  "/:id/confirm-assignment",
  protect,
  authorize("volunteer"),
  requireVerified,
  ctrl.confirmAssignment
);

// ======================================================
// VOLUNTEER
// Update live location
// ======================================================
router.put(
  "/:id/location",
  protect,
  authorize("volunteer"),
  requireVerified,
  ctrl.updateVolunteerLocation
);

// ======================================================
// VOLUNTEER
// Verify pickup using host OTP
// ======================================================
router.put(
  "/:id/verify-pickup",
  protect,
  authorize("volunteer"),
  requireVerified,
  upload.single("photo"),
  ctrl.verifyPickup
);

// ======================================================
// VOLUNTEER
// Mark food as delivered to NGO
// ======================================================
router.put(
  "/:id/deliver",
  protect,
  authorize("volunteer"),
  requireVerified,
  ctrl.markDelivered
);

module.exports = router;