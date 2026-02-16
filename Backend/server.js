require("dotenv").config();
const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const clientRoutes = require("./src/routes/clientRoutes");
const counselorRoutes = require("./src/routes/counselorRoutes");

const app = express();
const httpServer = createServer(app);

// CORS for local development
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.IO for local
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  path: '/socket.io/'
});

app.set('io', io);

// MongoDB Connection (local or Atlas)
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/counselordb");
    console.log('✅ MongoDB Connected Locally');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  }
};

// Routes
app.use("/api/clients", clientRoutes);
app.use("/api/counselor", counselorRoutes);

// Test route
app.get("/", (req, res) => {
  res.json({ message: "Server is running locally", socket: "active" });
});

// Socket test connection
io.on('connection', (socket) => {
  console.log('📡 Client connected locally:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('📡 Client disconnected:', socket.id);
  });
});

connectDB();

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`
   🚀 Local server running!
   📍 URL: http://localhost:${PORT}
   🔌 WebSocket: Active
  `);
});