require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

// Connect to database
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.io — allow CORS from frontend dev server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/appointments', require('./routes/appointmentRoutes'));
app.use('/api/sos', require('./routes/sosRoutes'));
app.use('/api/ocr', require('./routes/ocrRoutes'));
app.use('/api/medicine-orders', require('./routes/medicineOrderRoutes'));
app.use('/api/upload', require('./routes/uploadRoutes'));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'GramCare Backend running with Socket.io + MongoDB' });
});

// ─── Socket.io: Real-time Chat ───────────────────────────────────────────────
// Rooms are keyed by appointmentId
const chatHistory = {}; // in-memory message store per appointmentId

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Join the appointment chat room
  socket.on('join-room', ({ appointmentId, userName, role }) => {
    socket.join(appointmentId);
    socket.appointmentId = appointmentId;
    socket.userName = userName;
    socket.role = role;
    console.log(`[Socket] ${userName} (${role}) joined room: ${appointmentId}`);

    // Send existing chat history to the newly joined user
    if (chatHistory[appointmentId]) {
      socket.emit('chat-history', chatHistory[appointmentId]);
    }

    // Notify others in the room
    socket.to(appointmentId).emit('user-joined', { userName, role });
  });

  // Relay chat messages
  socket.on('send-message', ({ appointmentId, sender, role, text, timestamp }) => {
    const msg = { sender, role, text, timestamp: timestamp || new Date().toISOString() };

    // Store in memory
    if (!chatHistory[appointmentId]) chatHistory[appointmentId] = [];
    chatHistory[appointmentId].push(msg);
    // Keep last 100 messages per room
    if (chatHistory[appointmentId].length > 100) chatHistory[appointmentId].shift();

    // Broadcast to everyone in the room (including sender)
    io.to(appointmentId).emit('receive-message', msg);
    console.log(`[Socket] Message in room ${appointmentId} from ${sender}: ${text}`);
  });

  // User typing indicator
  socket.on('typing', ({ appointmentId, sender }) => {
    socket.to(appointmentId).emit('user-typing', { sender });
  });

  socket.on('disconnect', () => {
    if (socket.appointmentId && socket.userName) {
      socket.to(socket.appointmentId).emit('user-left', { userName: socket.userName });
    }
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});
// ─────────────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} with Socket.io enabled`);
});
