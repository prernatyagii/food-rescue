const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the JWT and attaches the user to req.user
const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(401).json({ message: "User no longer exists" });

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

// Restricts a route to specific roles, e.g. authorize("ngo", "admin")
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: `Role '${req.user.role}' cannot access this resource` });
    }
    next();
  };
};

// NGOs / Volunteers must be admin-verified before acting on donations
const requireVerified = (req, res, next) => {
  if (!req.user.isVerified) {
    return res.status(403).json({ message: "Your account is pending admin verification" });
  }
  next();
};

module.exports = { protect, authorize, requireVerified };
