const { io } = require("socket.io-client");
const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("Connected to socket server");
  process.exit(0);
});

socket.on("connect_error", (err) => {
  console.error("Connection Error:", err.message);
  process.exit(1);
});
