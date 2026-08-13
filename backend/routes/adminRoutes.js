const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const ctrl = require("../controllers/adminController");

router.use(protect, authorize("admin"));

router.get("/pending-verifications", ctrl.getPendingVerifications);
router.put("/verify/:userId", ctrl.verifyUser);
router.put("/deactivate/:userId", ctrl.deactivateUser);
router.get("/users", ctrl.getAllUsers);
router.get("/donations", ctrl.getAllDonations);

module.exports = router;
