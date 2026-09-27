const Donation = require("../models/Donation");
const User = require("../models/User");
const generateOtp = require("../utils/generateOtp");
const { notifyUser } = require("../utils/notify");

const RADIUS_KM = Number(process.env.MATCH_RADIUS_KM) || 25;

// ======================================================
// POST /api/donations
// HOST creates a donation
// ======================================================
const createDonation = async (req, res) => {
  try {
    const {
      foodType,
      quantity,
      description,
      lat,
      lng,
      address,
      estimatedWeightKg,
      hoursValid,
    } = req.body;

    if (
      !foodType ||
      !quantity ||
      lat === undefined ||
      lng === undefined
    ) {
      return res.status(400).json({
        message: "foodType, quantity, lat and lng are required",
      });
    }

    const latitude = Number(lat);
    const longitude = Number(lng);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return res.status(400).json({
        message: "Invalid latitude or longitude",
      });
    }

    const photoUrl = req.file
      ? `/uploads/${req.file.filename}`
      : "";

    const expiresAt = new Date(
      Date.now() +
        (Number(hoursValid) || 4) * 60 * 60 * 1000
    );

    // Save donation location as GeoJSON
    // IMPORTANT: GeoJSON order = [longitude, latitude]
    const donation = await Donation.create({
      host: req.user._id,
      foodType,
      quantity,
      description,
      photoUrl,
      estimatedWeightKg: Number(estimatedWeightKg) || 5,

      location: {
        type: "Point",
        coordinates: [longitude, latitude],
        address: address || "",
      },

      expiresAt,
    });

    console.log("========== NEW DONATION ==========");
    console.log("Food:", foodType);
    console.log("Donation location:", [
      longitude,
      latitude,
    ]);
    console.log("Expires:", expiresAt);
    console.log("===================================");

    // Find VERIFIED NGOs within 25 KM
   const nearbyNGOs = await User.find({
  role: "ngo",

      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [
              longitude,
              latitude,
            ],
          },
          $maxDistance: RADIUS_KM * 1000,
        },
      },
    }).select("_id name location");

    console.log(
      "Nearby verified NGOs:",
      nearbyNGOs.length
    );

    nearbyNGOs.forEach((ngo) => {
      console.log(
        "NGO:",
        ngo.name,
        "Location:",
        ngo.location?.coordinates
      );
    });

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

    res.status(201).json({
      donation,
      notifiedNgoCount: nearbyNGOs.length,
    });
  } catch (err) {
    console.error("Create donation error:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

// ======================================================
// GET /api/donations/nearby
// NGO gets pending donations within 25 KM
// ======================================================
const getNearbyDonations = async (req, res) => {
  try {
    const ngo = req.user;

    // ---------------------------------------------
    // Check NGO location exists
    // ---------------------------------------------
    if (
      !ngo.location ||
      !Array.isArray(ngo.location.coordinates) ||
      ngo.location.coordinates.length !== 2
    ) {
      return res.status(400).json({
        message:
          "NGO location is not set. Please update your current location.",
      });
    }

    const [lng, lat] = ngo.location.coordinates;

    // ---------------------------------------------
    // Validate NGO coordinates
    // ---------------------------------------------
    if (
      !Number.isFinite(Number(lng)) ||
      !Number.isFinite(Number(lat)) ||
      (Number(lng) === 0 && Number(lat) === 0)
    ) {
      return res.status(400).json({
        message:
          "NGO GPS location is missing. Please use current location and save your profile.",
      });
    }

    const ngoLongitude = Number(lng);
    const ngoLatitude = Number(lat);

    console.log("========== NEARBY SEARCH ==========");
    console.log("NGO:", ngo.name);
    console.log(
      "NGO coordinates:",
      [ngoLongitude, ngoLatitude]
    );
    console.log("Radius:", RADIUS_KM, "KM");

    // ---------------------------------------------
    // Find pending donations within 25 KM
    // ---------------------------------------------
    const donations = await Donation.find({
      status: "pending",

      // Donation must not be expired
      expiresAt: {
        $gt: new Date(),
      },

      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [
              ngoLongitude,
              ngoLatitude,
            ],
          },

          $maxDistance: RADIUS_KM * 1000,
        },
      },
    }).populate("host", "name phone");

    console.log(
      "Nearby donations found:",
      donations.length
    );

    // Print every matched donation location
    donations.forEach((donation) => {
      console.log("-----------------------------------");
      console.log(
        "Donation ID:",
        donation._id
      );
      console.log(
        "Food:",
        donation.foodType
      );
      console.log(
        "Donation location:",
        donation.location?.coordinates
      );
      console.log(
        "Status:",
        donation.status
      );
      console.log(
        "Expires:",
        donation.expiresAt
      );
    });

    console.log("===================================");

    res.json({
      donations,
    });
  } catch (err) {
    console.error(
      "Nearby donations error:",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
};

// ======================================================
// PUT /api/donations/:id/accept
// NGO accepts donation
// ======================================================
const acceptDonation = async (req, res) => {
  try {
    const donation =
      await Donation.findOneAndUpdate(
        {
          _id: req.params.id,
          status: "pending",
        },
        {
          status: "accepted",
          ngo: req.user._id,
          acceptedAt: new Date(),
          otp: generateOtp(),
        },
        {
          new: true,
        }
      );

    if (!donation) {
      return res.status(409).json({
        message:
          "Too late — this donation was already claimed by another NGO",
      });
    }

    await notifyUser({
      userId: donation.host,
      donationId: donation._id,
      type: "donation_accepted",
      message: `${req.user.name} accepted your donation. OTP ${donation.otp} — share it with the volunteer at pickup.`,
    });

    res.json({
      donation,
    });
  } catch (err) {
    console.error("Accept donation error:", err);

    res.status(500).json({
      message: err.message,
    });
  }
};

// ======================================================
// PUT /api/donations/:id/assign-volunteer
// NGO assigns volunteer
// ======================================================
const assignVolunteer = async (req, res) => {
  try {
    const { volunteerId } = req.body;

    const volunteer = await User.findOne({
      _id: volunteerId,
      role: "volunteer",
      isVerified: true,
    });

    if (!volunteer) {
      return res.status(404).json({
        message: "Verified volunteer not found",
      });
    }

    const donation =
      await Donation.findOneAndUpdate(
        {
          _id: req.params.id,
          ngo: req.user._id,
          status: "accepted",
        },
        {
          status: "assigned",
          volunteer: volunteerId,
          assignedAt: new Date(),
        },
        {
          new: true,
        }
      );

    if (!donation) {
      return res.status(404).json({
        message:
          "Donation not found or not in an assignable state",
      });
    }

    await notifyUser({
      userId: donation.host,
      donationId: donation._id,
      type: "volunteer_assigned",
      message: `Volunteer ${volunteer.name} is on the way to pick up your donation.`,
    });

    res.json({
      donation,
    });
  } catch (err) {
    console.error(
      "Assign volunteer error:",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
};

// ======================================================
// PUT /api/donations/:id/location
// Volunteer live location
// ======================================================
const updateVolunteerLocation = async (
  req,
  res
) => {
  try {
    const { lat, lng } = req.body;

    const donation =
      await Donation.findOneAndUpdate(
        {
          _id: req.params.id,
          volunteer: req.user._id,
        },
        {
          volunteerLocation: {
            coordinates: [
              Number(lng),
              Number(lat),
            ],
            updatedAt: new Date(),
          },
        },
        {
          new: true,
        }
      );

    if (!donation) {
      return res.status(404).json({
        message: "Donation not found",
      });
    }

    const io = req.app.get("io");

    if (io) {
      io.to(`donation:${donation._id}`).emit(
        "volunteer_location",
        donation.volunteerLocation
      );
    }

    res.json({
      ok: true,
    });
  } catch (err) {
    console.error(
      "Volunteer location error:",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
};

// ======================================================
// PUT /api/donations/:id/verify-pickup
// Volunteer verifies pickup using OTP
// ======================================================
const verifyPickup = async (req, res) => {
  try {
    const { otp } = req.body;

    const donation =
      await Donation.findOne({
        _id: req.params.id,
        volunteer: req.user._id,
      });

    if (!donation) {
      return res.status(404).json({
        message: "Donation not found",
      });
    }

    if (donation.status !== "assigned") {
      return res.status(400).json({
        message:
          "Donation is not awaiting pickup",
      });
    }

    if (donation.otp !== otp) {
      return res.status(400).json({
        message: "Incorrect OTP",
      });
    }

    donation.status = "picked_up";
    donation.pickedUpAt = new Date();

    if (req.file) {
      donation.pickupPhotoUrl =
        `/uploads/${req.file.filename}`;
    }

    await donation.save();

    await notifyUser({
      userId: donation.host,
      donationId: donation._id,
      type: "pickup_verified",
      message:
        "Pickup verified — your donation is on its way to the NGO.",
    });

    res.json({
      donation,
    });
  } catch (err) {
    console.error(
      "Verify pickup error:",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
};

// ======================================================
// PUT /api/donations/:id/deliver
// Volunteer marks donation delivered
// ======================================================
const markDelivered = async (req, res) => {
  try {
    const donation =
      await Donation.findOneAndUpdate(
        {
          _id: req.params.id,
          volunteer: req.user._id,
          status: "picked_up",
        },
        {
          status: "delivered",
          deliveredAt: new Date(),
        },
        {
          new: true,
        }
      );

    if (!donation) {
      return res.status(400).json({
        message:
          "Donation is not awaiting delivery",
      });
    }

    await notifyUser({
      userId: donation.ngo,
      donationId: donation._id,
      type: "delivered",
      message:
        "Donation delivered. Thank you!",
    });

    res.json({
      donation,
    });
  } catch (err) {
    console.error(
      "Mark delivered error:",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
};

// ======================================================
// GET /api/donations/mine
// Role-aware donation history
// ======================================================
const getMyDonations = async (req, res) => {
  try {
    const filter = {
      [req.user.role === "host"
        ? "host"
        : req.user.role]: req.user._id,
    };

    const donations =
      await Donation.find(filter)
        .populate("host", "name phone")
        .populate(
          "ngo",
          "name ngoDetails.orgName"
        )
        .populate(
          "volunteer",
          "name phone"
        )
        .sort("-createdAt");

    res.json({
      donations,
    });
  } catch (err) {
    console.error(
      "Get my donations error:",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
};

// ======================================================
// GET /api/donations/:id
// Single donation detail
// ======================================================
const getDonationById = async (req, res) => {
  try {
    const donation =
      await Donation.findById(
        req.params.id
      )
        .populate(
          "host",
          "name phone"
        )
        .populate(
          "ngo",
          "name ngoDetails.orgName"
        )
        .populate(
          "volunteer",
          "name phone"
        );

    if (!donation) {
      return res.status(404).json({
        message: "Donation not found",
      });
    }

    res.json({
      donation,
    });
  } catch (err) {
    console.error(
      "Get donation error:",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
};

// ======================================================
// GET /api/donations/volunteers/available
// NGO gets available verified volunteers
// ======================================================
const getAvailableVolunteers = async (
  req,
  res
) => {
  try {
    const volunteers =
      await User.find({
        role: "volunteer",
        isVerified: true,
      }).select("name phone");

    res.json({
      volunteers,
    });
  } catch (err) {
    console.error(
      "Get volunteers error:",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
};

// ======================================================
// EXPORTS
// ======================================================
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