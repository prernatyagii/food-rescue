// Run with: npm run seed
// Creates one admin account and a few sample host/ngo/volunteer accounts
// (around Surat, Gujarat) so you can log in and demo the flow immediately.
require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");

const demoUsers = [
  {
    name: "Admin",
    email: "admin@foodrescue.com",
    password: "admin123",
    phone: "9000000000",
    role: "admin",
    location: { type: "Point", coordinates: [72.8311, 21.1702], address: "Surat, Gujarat" },
  },
  {
    name: "Green Leaf Restaurant",
    email: "host@foodrescue.com",
    password: "host123",
    phone: "9000000001",
    role: "host",
    location: { type: "Point", coordinates: [72.8311, 21.1702], address: "City Light, Surat" },
  },
  {
    name: "Seva Foundation",
    email: "ngo@foodrescue.com",
    password: "ngo123",
    phone: "9000000002",
    role: "ngo",
    isVerified: true,
    ngoDetails: { orgName: "Seva Foundation", registrationNumber: "NGO-GJ-1029" },
    location: { type: "Point", coordinates: [72.8397, 21.1959], address: "Adajan, Surat" },
  },
  {
    name: "Ramesh Kumar",
    email: "volunteer@foodrescue.com",
    password: "volunteer123",
    phone: "9000000003",
    role: "volunteer",
    isVerified: true,
    location: { type: "Point", coordinates: [72.83, 21.19], address: "Surat" },
  },
];

(async () => {
  await connectDB();

  for (const u of demoUsers) {
    const exists = await User.findOne({ email: u.email });
    if (exists) {
      console.log(`Skipping (already exists): ${u.email}`);
      continue;
    }
    const hashed = await bcrypt.hash(u.password, 10);
    await User.create({ ...u, password: hashed });
    console.log(`Created ${u.role}: ${u.email} / ${u.password}`);
  }

  console.log("\nSeed complete. Demo logins:");
  demoUsers.forEach((u) => console.log(`  ${u.role.padEnd(10)} ${u.email} / ${u.password}`));

  await mongoose.disconnect();
  process.exit(0);
})();
