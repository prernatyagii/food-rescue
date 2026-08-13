# Food Rescue — MERN Stack Project

Connecting surplus food (from restaurants, event venues, caterers, households) to
verified NGOs in real time, using geolocation-based matching. Built to match the
scope of the "First Review" report: Auth & roles, donation posting, geospatial
matching + notifications, first-accept-wins booking, live volunteer tracking,
OTP + photo pickup verification, admin verification, and an impact dashboard.

## Stack

- **Frontend:** React (Vite), Tailwind CSS, React Router, Recharts (charts),
  React-Leaflet (live tracking map — uses free OpenStreetMap tiles, no API key needed),
  Socket.io client
- **Backend:** Node.js, Express, MongoDB (Mongoose, 2dsphere geospatial index),
  JWT auth, Multer (photo uploads), Socket.io (real-time notifications & tracking)

> Note: the report lists Google Maps API, Cloudinary, Firebase Cloud Messaging and
> Twilio. To keep this runnable for free without any paid API keys, this build uses
> local file storage instead of Cloudinary, OpenStreetMap/Leaflet instead of Google
> Maps, and mocked (logged + in-app + Socket.io real-time) notifications instead of
> Firebase/Twilio. Swap points are clearly marked in `backend/utils/notify.js` if
> you want to wire up the real services later.

---

## 1. Prerequisites

- **Node.js** v18 or newer (check with `node -v`)
- **MongoDB** — either:
  - Install MongoDB Community Server locally and have it running on
    `mongodb://127.0.0.1:27017`, **or**
  - Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas) and
    get its connection string

---

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and set `MONGO_URI` (local or Atlas) and change `JWT_SECRET` to any
random string. Defaults are fine for local MongoDB.

Create demo accounts (one for each role) so you can log in immediately:

```bash
npm run seed
```

This prints demo logins, e.g.:
```
admin      admin@foodrescue.com / admin123
host       host@foodrescue.com / host123
ngo        ngo@foodrescue.com / ngo123
volunteer  volunteer@foodrescue.com / volunteer123
```

Start the backend:

```bash
npm run dev
```

You should see `MongoDB connected: ...` and `Food Rescue API running on port 5000`.
Check it's alive: open `http://localhost:5000/api/health` in a browser.

---

## 3. Frontend setup

Open a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

This starts Vite on `http://localhost:5173` and proxies `/api`, `/uploads`, and
`/socket.io` to the backend on port 5000 — so just open:

```
http://localhost:5173
```

---

## 4. Demo walkthrough (matches the report's workflow, slide 9)

1. Log in as the **Host** (`host@foodrescue.com` / `host123`) → go to "Post surplus
   food" → detect location → fill in food details → post. It instantly matches and
   notifies verified NGOs within the radius (default 25 km, in `.env` as
   `MATCH_RADIUS_KM`).
2. Log in as the **NGO** (`ngo@foodrescue.com` / `ngo123`) in another browser
   (or an incognito window) → see the donation appear on the "Nearby pending
   donations" list in real time → click **Accept** (this is the first-accept-wins
   claim — an OTP is generated automatically) → assign the seeded volunteer.
3. Log in as the **Volunteer** (`volunteer@foodrescue.com` / `volunteer123`) → see
   the assignment → ask the Host for the pickup OTP (shown on the Host's donation
   detail / track page) → enter it to confirm pickup → mark delivered.
4. Visit **Impact** in the navbar (public page, no login needed) to see the meals
   saved / kg reduced / charts update.
5. Log in as **Admin** (`admin@foodrescue.com` / `admin123`) to verify any new
   NGO/volunteer signups and see every donation across the platform.

Open `/track/<donation id>` (linked from any donation card as "View details") to
see the live map — if the volunteer's browser has location sharing on, their
marker moves in real time via Socket.io.

---

## 5. Project structure

```
food-rescue/
├── backend/
│   ├── server.js              # Express + Socket.io entrypoint
│   ├── config/db.js           # Mongo connection
│   ├── models/                # User, Donation, Notification (Mongoose schemas)
│   ├── controllers/           # Route logic (auth, donations, admin, dashboard)
│   ├── routes/                # Express routers
│   ├── middleware/             # JWT auth, role guard, multer upload
│   ├── utils/                 # token/OTP generation, mock notifications, seed script
│   └── uploads/                # Uploaded donation/pickup photos (served statically)
└── frontend/
    └── src/
        ├── pages/              # Login, Register, Host/NGO/Volunteer/Admin dashboards,
        │                       # Impact dashboard, Track donation (map)
        ├── components/         # Navbar, DonationCard, StatCard, StatusBadge, ProtectedRoute
        ├── context/AuthContext.jsx
        └── api/                # axios instance + socket.io client
```

## 6. What's new in this pass (premium UI + extra features)

- **Design**: custom SVG logo (`components/Logo.jsx`), decorative
  low-opacity background patterns instead of stock photos
  (`components/BackgroundPattern.jsx`), a themed "banner" at the top of
  every role dashboard (`components/RoleBanner.jsx`), and global premium
  button/card utility classes (`.btn-primary`, `.btn-secondary`,
  `.card-premium` in `index.css`).
- **Profile management**: every role can now edit their own profile
  (name, phone, address, and NGO org details) from the avatar dropdown
  in the navbar → `/profile`. Backend: `PUT /api/auth/me`.
- **Feedback system**: once a donation is `delivered`, participants
  (Host/NGO/Volunteer) can rate and comment on each other from the
  Track Donation page. Backend: `POST /api/feedback`,
  `GET /api/feedback/for/:userId`, `GET /api/feedback/donation/:donationId`.
- **Auto-expiry**: a background sweep (`backend/utils/expireDonations.js`)
  runs every 5 minutes and flips any `pending` donation past its
  `expiresAt` (best-before) time to `expired`, so it silently drops out
  of NGOs' Available Food list. No setup needed — it starts
  automatically with the server.

## 7. Common issues

- **"MongoDB connection error"** → MongoDB isn't running locally, or your Atlas
  connection string / IP allowlist is wrong. Check `MONGO_URI` in `backend/.env`.
- **NGO doesn't see a donation** → the NGO account must be `isVerified: true`
  (the seeded NGO already is). New NGO signups need Admin verification first.
- **Location prompts** → the browser will ask for location permission when
  posting a donation, viewing the NGO dashboard, or as a volunteer — allow it,
  since matching is radius-based.
- **Photos not showing** → make sure the backend is running on port 5000; photos
  are served from `http://localhost:5000/uploads/...` and proxied by Vite.
