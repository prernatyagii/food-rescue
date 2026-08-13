const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/feedbackController");

router.post("/", protect, ctrl.createFeedback);
router.get("/for/:userId", protect, ctrl.getFeedbackForUser);
router.get("/donation/:donationId", protect, ctrl.getFeedbackForDonation);

module.exports = router;
