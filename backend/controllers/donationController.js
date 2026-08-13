const Donation = require("../models/Donation");
const User = require("../models/User");
const generateOtp = require("../utils/generateOtp");
const { notifyUser } = require("../utils/notify");

const RADIUS_KM = Number(process.env.MATCH_RADIUS_KM) || 25;

// POST /api/donations   (host)
// Creates a donation, then finds verified NGOs within the radius and notifies them.
const createDonation = async (req, res) => {
  try {
    const { foodType, quantity, description, lat, lng, address, estimatedWeightKg, hoursValid } = req.body;

    if (!foodType || !quantity || !lat || !lng) {
      return res.status(400).json({ message: "foodType, quantity, lat and lng are required" });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : "";
    const expiresAt = new Date(Date.now() + (Number(hoursValid) || 4) * 60 * 60 * 1000);

    const donation = await Donation.create({
      host: req.user._id,
      foodType,
      quantity,
      description,
      photoUrl,
      estimatedWeightKg: Number(estimatedWeightKg) || 5,
      location: {
        type: "Point",
        coordinates: [Number(lng), Number(lat)],
        address: address || "",
      },
      expiresAt,
    });

    // Geospatial matching — verified NGOs within RADIUS_KM
    const nearbyNGOs = await User.find({
      role: "ngo",
      isVerified: true,
      location: {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [Number(lng), Number(lat)] },
          $maxDistance: RADIUS_KM * 1000,
        },
      },
    }).select("_id name");

    await Promise.all(
      nearbyNGOs.map((ngo) =>
        notifyUser({
          userId: ngo._id,
          donationId: donation._id,
          type: "new_donation_nearby",
          message: `New surplus food donation (${foodType}, ${quantity}) posted ${RADIUS_KM}km or closer to you.`,
        })
      )
    );

    res.status(201).json({ donation, notifiedNgoCount: nearbyNGOs.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/donations/nearby   (ngo) — pending donations within radius
const getNearbyDonations = async (req, res) => {
  try {
    const ngo = req.user;
    const [lng, lat] = ngo.location.coordinates;

    const donations = await Donation.find({
      status: "pending",
      expiresAt: { $gt: new Date() },
      location: {
        $nearSphere: {
          $geometry: { type: "Point", coordinates: [lng, lat] },
          $maxDistance: RADIUS_KM * 1000,
        },
      },
    }).populate("host", "name phone");

    res.json({ donations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/donations/:id/accept   (ngo) — first-accept-wins
const acceptDonation = async (req, res) => {
  try {
    // Atomic update: only succeeds if status is still "pending".
    // This is what makes "first-accept-wins" race-condition safe —
    // two NGOs hitting this at the same instant can't both win.
    const donation = await Donation.findOneAndUpdate(
      { _id: req.params.id, status: "pending" },
      { status: "accepted", ngo: req.user._id, acceptedAt: new Date(), otp: generateOtp() },
      { new: true }
    );

    if (!donation) {
      return res.status(409).json({ message: "Too late — this donation was already claimed by another NGO" });
    }

    await notifyUser({
      userId: donation.host,
      donationId: donation._id,
      type: "donation_accepted",
      message: `${req.user.name} accepted your donation. OTP ${donation.otp} — share it with the volunteer at pickup.`,
    });

    res.json({ donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/donations/:id/assign-volunteer   (ngo)
const assignVolunteer = async (req, res) => {
  try {
    const { volunteerId } = req.body;
    const volunteer = await User.findOne({ _id: volunteerId, role: "volunteer", isVerified: true });
    if (!volunteer) return res.status(404).json({ message: "Verified volunteer not found" });

    const donation = await Donation.findOneAndUpdate(
      { _id: req.params.id, ngo: req.user._id, status: "accepted" },
      { status: "assigned", volunteer: volunteerId, assignedAt: new Date() },
      { new: true }
    );
    if (!donation) return res.status(404).json({ message: "Donation not found or not in an assignable state" });

    await notifyUser({
      userId: donation.host,
      donationId: donation._id,
      type: "volunteer_assigned",
      message: `Volunteer ${volunteer.name} is on the way to pick up your donation.`,
    });

    res.json({ donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/donations/:id/location   (volunteer) — live tracking ping
const updateVolunteerLocation = async (req, res) => {
  try {
    const { lat, lng } = req.body;
    const donation = await Donation.findOneAndUpdate(
      { _id: req.params.id, volunteer: req.user._id },
      { volunteerLocation: { coordinates: [Number(lng), Number(lat)], updatedAt: new Date() } },
      { new: true }
    );
    if (!donation) return res.status(404).json({ message: "Donation not found" });

    const io = req.app.get("io");
    if (io) io.to(`donation:${donation._id}`).emit("volunteer_location", donation.volunteerLocation);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/donations/:id/verify-pickup   (volunteer) — OTP + photo proof
const verifyPickup = async (req, res) => {
  try {
    const { otp } = req.body;
    const donation = await Donation.findOne({ _id: req.params.id, volunteer: req.user._id });
    if (!donation) return res.status(404).json({ message: "Donation not found" });
    if (donation.status !== "assigned") {
      return res.status(400).json({ message: "Donation is not awaiting pickup" });
    }
    if (donation.otp !== otp) {
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    donation.status = "picked_up";
    donation.pickedUpAt = new Date();
    if (req.file) donation.pickupPhotoUrl = `/uploads/${req.file.filename}`;
    await donation.save();

    await notifyUser({
      userId: donation.host,
      donationId: donation._id,
      type: "pickup_verified",
      message: "Pickup verified — your donation is on its way to the NGO.",
    });

    res.json({ donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/donations/:id/deliver   (volunteer)
const markDelivered = async (req, res) => {
  try {
    const donation = await Donation.findOneAndUpdate(
      { _id: req.params.id, volunteer: req.user._id, status: "picked_up" },
      { status: "delivered", deliveredAt: new Date() },
      { new: true }
    );
    if (!donation) return res.status(400).json({ message: "Donation is not awaiting delivery" });

    await notifyUser({
      userId: donation.ngo,
      donationId: donation._id,
      type: "delivered",
      message: "Donation delivered. Thank you!",
    });

    res.json({ donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/donations/mine — role-aware history (host / ngo / volunteer)
const getMyDonations = async (req, res) => {
  try {
    const filter = { [req.user.role === "host" ? "host" : req.user.role]: req.user._id };
    const donations = await Donation.find(filter)
      .populate("host", "name phone")
      .populate("ngo", "name ngoDetails.orgName")
      .populate("volunteer", "name phone")
      .sort("-createdAt");
    res.json({ donations });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/donations/:id — single donation detail (for tracking page)
const getDonationById = async (req, res) => {
  try {
    const donation = await Donation.findById(req.params.id)
      .populate("host", "name phone")
      .populate("ngo", "name ngoDetails.orgName")
      .populate("volunteer", "name phone");
    if (!donation) return res.status(404).json({ message: "Donation not found" });
    res.json({ donation });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/donations/volunteers/available  (ngo) — verified volunteers to assign
const getAvailableVolunteers = async (req, res) => {
  try {
    const volunteers = await User.find({ role: "volunteer", isVerified: true }).select("name phone");
    res.json({ volunteers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createDonation,
  getNearbyDonations,
  acceptDonation,
  assignVolunteer,
  updateVolunteerLocation,
  verifyPickup,
  markDelivered,
  getMyDonations,
  getDonationById,
  getAvailableVolunteers,
};
