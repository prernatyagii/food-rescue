const jwt = require("jsonwebtoken");

// Sets up Socket.io auth (token passed in `auth.token`) and puts every
// connected user into a personal room `user:<id>` so notify.js can push
// events straight to them, plus lets clients join `donation:<id>` rooms
// to watch a single delivery's live volunteer location.
function initSocket(io) {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(); // allow anonymous connections too (e.g. public tracking page)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(); // invalid token -> connect anonymously rather than crash the socket
    }
  });

  io.on("connection", (socket) => {
    if (socket.userId) socket.join(`user:${socket.userId}`);

    socket.on("watch_donation", (donationId) => {
      socket.join(`donation:${donationId}`);
    });

    socket.on("unwatch_donation", (donationId) => {
      socket.leave(`donation:${donationId}`);
    });
  });
}

module.exports = initSocket;
