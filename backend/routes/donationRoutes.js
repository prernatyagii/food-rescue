const express = require("express");
const router = express.Router();
const { protect, authorize, requireVerified } = require("../middleware/auth");
const upload = require("../middleware/upload");
const ctrl = require("../controllers/donationController");

router.post("/", protect, authorize("host"), upload.single("photo"), ctrl.createDonation);
router.get("/nearby", protect, authorize("ngo"), requireVerified, ctrl.getNearbyDonations);
router.get("/mine", protect, ctrl.getMyDonations);
router.get("/volunteers/available", protect, authorize("ngo"), requireVerified, ctrl.getAvailableVolunteers);
router.get("/:id", protect, ctrl.getDonationById);

router.put("/:id/accept", protect, authorize("ngo"), requireVerified, ctrl.acceptDonation);
router.put("/:id/assign-volunteer", protect, authorize("ngo"), requireVerified, ctrl.assignVolunteer);
router.put("/:id/location", protect, authorize("volunteer"), requireVerified, ctrl.updateVolunteerLocation);
router.put("/:id/verify-pickup", protect, authorize("volunteer"), requireVerified, upload.single("photo"), ctrl.verifyPickup);
router.put("/:id/deliver", protect, authorize("volunteer"), requireVerified, ctrl.markDelivered);

module.exports = router;
