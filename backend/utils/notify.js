// Mock multi-channel notification sender.
//
// The report describes "instant multi-channel notifications (app, push, SMS)".
// For a demo/college project we don't want to require paid Twilio/Firebase
// credentials just to run the app, so this logs the notification, saves it
// to the DB (so it shows up in-app), and emits it over Socket.io in real time.
//
// To wire up real SMS/push later: drop your Twilio/Firebase code into the
// marked spots below — the rest of the app doesn't need to change.

const Notification = require("../models/Notification");

let ioInstance = null;
const setIO = (io) => {
  ioInstance = io;
};

const notifyUser = async ({ userId, donationId, type, message }) => {
  // 1. Persist so the user can see it in-app even if offline right now
  const notification = await Notification.create({
    user: userId,
    donation: donationId,
    type,
    message,
  });

  // 2. Real-time push via Socket.io ("app" + "push" channels)
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit("notification", notification);
  }

  // 3. SMS fallback — mocked. Replace with real Twilio call:
  //    await twilioClient.messages.create({ to: phone, from: TWILIO_NUMBER, body: message });
  console.log(`[SMS-MOCK] -> user ${userId}: ${message}`);

  return notification;
};

module.exports = { setIO, notifyUser };
