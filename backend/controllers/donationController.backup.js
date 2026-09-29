

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

    // GeoJSON order = [longitude, latitude]
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

    // Find NGOs within configured radius
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
// NGO gets pending donations within radius
// ======================================================
const getNearbyDonations = async (req, res) => {
  try {
    const ngo = req.user;

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

    const donations = await Donation.find({
      status: "pending",

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
          "Too late - this donation was already claimed by another NGO",
      });
    }

    await notifyUser({
      userId: donation.host,
      donationId: donation._id,
      type: "donation_accepted",
      message: `${req.user.name} accepted your donation. The donation is now being prepared for volunteer pickup.`,
    });

    res.json({
      donation,
    });
  } catch (err) {
    console.error(
      "Accept donation error:",
      err
    );

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

    // Generate fresh 4-digit pickup OTP
    const otp = generateOtp();

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
          otp: otp,
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

    // Get host details
    const host = await User.findById(
      donation.host
    ).select("name email location");

    // Get NGO details
    const ngo = await User.findById(
      req.user._id
    ).select(
      "name email location ngoDetails"
    );

    // ==================================================
    // IMPORTANT FLOW
    //
    // NGO assigns volunteer
    //       ↓
    // Volunteer gets assignment email
    //       ↓
    // Volunteer confirms assignment
    //       ↓
    // Host gets OTP
    //
    // OTP is NOT sent to host at this stage.
    // ==================================================

    await notifyUser({
      userId: volunteer._id,
      donationId: donation._id,
      type: "volunteer_assigned",
      message: `
NGO ${ngo?.name || req.user.name} has assigned you to collect and deliver a food donation.

Pickup From:
${host?.name || "Host"}

Pickup Address:
${donation.location?.address || "Host pickup location"}

Food:
${donation.foodType || "Food"}

Quantity:
${donation.quantity || "Not specified"}

Deliver To:
${ngo?.name || req.user.name}

NGO Address:
${ngo?.location?.address || "NGO delivery location"}

Please open your Volunteer Dashboard and confirm this assignment.
      `.trim(),
    });

    res.json({
      donation,
      message:
        "Volunteer assigned successfully. Assignment email sent to volunteer.",
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
// PUT /api/donations/:id/confirm-assignment
// Volunteer confirms assignment
// Host receives pickup OTP
// ======================================================
const confirmAssignment = async (
  req,
  res
) => {
  try {
    const donation =
      await Donation.findOne({
        _id: req.params.id,
        volunteer: req.user._id,
        status: "assigned",
      });

    if (!donation) {
      return res.status(404).json({
        message:
          "Donation not found or not assigned to you",
      });
    }

    const host = await User.findById(
      donation.host
    ).select("name email");

    if (!host) {
      return res.status(404).json({
        message: "Host not found",
      });
    }

    // Send OTP to host only after
    // volunteer confirms assignment.
    await notifyUser({
      userId: host._id,
      donationId: donation._id,
      type: "volunteer_assigned",
      message: `
Volunteer ${req.user.name} has confirmed the assignment for your food donation.

Your pickup OTP is: ${donation.otp}

Please share this OTP with the volunteer when the volunteer arrives to collect the food.
      `.trim(),
    });

    res.json({
      message:
        "Assignment confirmed. Pickup OTP has been sent to the host.",
      donation,
    });
  } catch (err) {
    console.error(
      "Confirm assignment error:",
      err
    );

    res.status(500).json({
      message:
        err.message ||
        "Failed to confirm assignment",
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

    const latitude = Number(lat);
    const longitude = Number(lng);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return res.status(400).json({
        message:
          "Invalid volunteer location",
      });
    }

    const donation =
      await Donation.findOneAndUpdate(
        {
          _id: req.params.id,
          volunteer: req.user._id,
        },
        {
          volunteerLocation: {
            coordinates: [
              longitude,
              latitude,
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
      io.to(
        `donation:${donation._id}`
      ).emit(
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
        "Pickup verified - the volunteer has collected your food donation and it is on its way to the NGO.",
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

    // Notify HOST that food has reached NGO
    await notifyUser({
      userId: donation.host,
      donationId: donation._id,
      type: "delivered",
      message:
        "Your food donation has successfully reached the NGO. Thank you for helping us reduce food waste!",
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
        .populate(
          "host",
          "name phone location"
        )
        .populate(
          "ngo",
          "name ngoDetails.orgName location"
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
          "name phone location"
        )
        .populate(
          "ngo",
          "name ngoDetails.orgName location"
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
      }).select(
        "name phone email"
      );

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
  confirmAssignment,
  updateVolunteerLocation,
  verifyPickup,
  markDelivered,
  getMyDonations,
  getDonationById,
  getAvailableVolunteers,
};