const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const info = await transporter.sendMail({
      from: `"Food Rescue Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });
    console.log(`[EMAIL-SUCCESS] Sent to ${to} (ID: ${info.messageId})`);
    return true;
  } catch (err) {
    console.error(`[EMAIL-FAIL] Error sending to ${to}:`, err.message);
    return false;
  }
};

module.exports = { sendEmail };
