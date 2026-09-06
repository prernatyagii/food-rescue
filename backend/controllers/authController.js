const bcrypt = require("bcryptjs");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const generateOtp = require("../utils/generateOtp");
const { notifyUser } = require("../utils/notify");

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role,
      lat,
      lng,
      address,
      orgName,
      registrationNumber,
    } = req.body;

    if (!name || !email || !password || !phone || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    if (!["host", "ngo", "volunteer"].includes(role)) {
      // Admin accounts are seeded directly, not self-registered
      return res
        .status(400)
        .json({ message: "Invalid role for self-registration" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing)
      return res.status(409).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      phone,
      role,
      location: {
        type: "Point",
        coordinates: [Number(lng) || 0, Number(lat) || 0],
        address: address || "",
      },
      ngoDetails: role === "ngo" ? { orgName, registrationNumber } : undefined,
    });

    const token = generateToken(user._id, user.role);
    res.status(201).json({
      token,
      user: sanitize(user),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user)
      return res.status(401).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ message: "Invalid email or password" });

    const token = generateToken(user._id, user.role);
    res.json({ token, user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: sanitize(req.user) });
};

// PUT /api/auth/me — update own profile (every role can manage their profile)
const updateMe = async (req, res) => {
  try {
    const { name, phone, address, orgName, registrationNumber } = req.body;
    const user = req.user;

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (address !== undefined) user.location.address = address;
    if (user.role === "ngo") {
      if (orgName !== undefined) user.ngoDetails.orgName = orgName;
      if (registrationNumber !== undefined)
        user.ngoDetails.registrationNumber = registrationNumber;
    }

    await user.save();
    res.json({ user: sanitize(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user)
      return res.status(404).json({ message: "No account with this email" });

    const otp = generateOtp();
    user.resetOtp = otp;
    user.resetOtpExpiry = Date.now() + 10 * 60 * 1000; // 10 min
    await user.save();

    await notifyUser({
      userId: user._id,
      type: "password_reset",
      message: `Your password reset OTP is ${otp} (valid 10 min)`,
    });

    res.json({ message: "OTP sent" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (
      !user ||
      user.resetOtp !== otp ||
      !user.resetOtpExpiry ||
      user.resetOtpExpiry < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetOtp = null;
    user.resetOtpExpiry = null;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
function sanitize(user) {
  const obj = user.toObject ? user.toObject() : user;
  delete obj.password;
  return obj;
}

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  forgotPassword,
  resetPassword,
};
