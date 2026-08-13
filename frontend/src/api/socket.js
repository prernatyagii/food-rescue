import { io } from "socket.io-client";

let socket = null;

// Lazily create a single shared socket connection, authenticated with the
// current JWT so the server can put us in our personal `user:<id>` room.
export const getSocket = () => {
  if (!socket) {
    socket = io("/", {
      path: "/socket.io",
      autoConnect: true,
      auth: { token: localStorage.getItem("fr_token") || "" },
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
