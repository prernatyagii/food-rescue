require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const initSocket = require("./socket");
const { setIO } = require("./utils/notify");
const { startExpirySweep } = require("./utils/expireDonations");

const authRoutes = require("./routes/authRoutes");
const donationRoutes = require("./routes/donationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const feedbackRoutes = require("./routes/feedbackRoutes");

connectDB();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api/health", (req, res) => res.json({ status: "ok", service: "food-rescue-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/feedback", feedbackRoutes);

// 404 + error handling
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error", detail: err.message });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });
initSocket(io);
setIO(io);
app.set("io", io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Food Rescue API running on port ${PORT}`));

// Auto-expire donations that passed their best-before time without being claimed
startExpirySweep();
