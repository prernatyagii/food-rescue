const Notification = require("../models/Notification");
const User = require("../models/User");
const { sendEmail } = require("./email");

let ioInstance = null;
const setIO = (io) => {
  ioInstance = io;
};

const notifyUser = async ({ userId, donationId, type, message }) => {
  // 1. In-app notification save
  const notification = await Notification.create({
    user: userId,
    donation: donationId,
    type,
    message,
  });

  // 2. Real-time Socket.io push
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit("notification", notification);
  }

  // 3. Real-time Email & OTP delivery
  try {
    const recipient = await User.findById(userId).select("email name");
console.log(
  `[NOTIFY] user=${userId} name=${recipient?.name} email=${recipient?.email}`
);
    if (recipient && recipient.email) {
      const subject = `Food Rescue: ${type.replace(/_/g, " ").toUpperCase()}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #16a34a; margin-top: 0;">Food Rescue Alert</h2>
          <p>Hello <b>${recipient.name || "User"}</b>,</p>
          <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px; margin: 16px 0; font-size: 15px;">
            ${message}
          </div>
          <p style="color: #6b7280; font-size: 12px; margin-bottom: 0;">
            This is an automated real-time notification from the Food Rescue system.
          </p>
        </div>
      `;
      await sendEmail({ to: recipient.email, subject, html, text: message });
    }
  } catch (err) {
    console.error("[EMAIL-TRIGGER-ERROR]:", err.message);
  }

  return notification;
};

module.exports = { setIO, notifyUser };
