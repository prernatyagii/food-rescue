const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { getStats } = require("../controllers/dashboardController");

router.get("/stats", protect, getStats);

module.exports = router;
