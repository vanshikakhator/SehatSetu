const { io } = require("socket.io-client");
const socket = io("http://localhost:5000", { transports: ['websocket', 'polling'] });

socket.on("connect", () => {
  console.log("Connected with id:", socket.id);
  socket.disconnect();
});
socket.on("connect_error", (err) => {
  console.error("error:", err.message);
  process.exit(1);
});
