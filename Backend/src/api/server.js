require("dotenv").config();
const express = require("express");
const { Server } = require("socket.io");
const { createServer } = require("http");
const mongoose = require("mongoose");
const cors = require("cors");
const clientRoutes = require("../src/routes/clientRoutes");
const counselorRoutes = require("../src/routes/counselorRoutes");

const app = express();
const httpServer = createServer(app);

// CORS for production
const corsOptions = {
  origin: [
    "https://your-frontend.vercel.app", 
    "http://localhost:5173",
    "http://localhost:5174"
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Socket.IO setup
const io = new Server(httpServer, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
  path: '/socket.io/'
});

// Make io available to routes
app.set('io', io);

// MongoDB Connection
let dbConnected = false;
let changeStream = null;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
    dbConnected = true;
    setupChangeStream();
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  }
};

// Client Model
const clientSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  dob: Date,
  age: Number,
  country: String,
  state: String,
  city: String,
  eduLevel: { type: String, required: true },
  domain: String,
  course: String,
  message: String,
  status: { type: String, enum: ["new", "in-progress", "completed"], default: "new" },
  isNew: { type: Boolean, default: true },
  domainViewed: { type: Boolean, default: false },
  courseViewed: { type: Boolean, default: false },
  studentViewed: { type: Boolean, default: false },
  newAt: { type: Date, default: Date.now }
}, { timestamps: true });

const Client = mongoose.models.Client || mongoose.model("Client", clientSchema);

// Calculate domain stats
async function calculateDomainStats() {
  try {
    const stats = await Client.aggregate([
      {
        $group: {
          _id: "$domain",
          total: { $sum: 1 },
          new: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ["$isNew", true] },
                    { $eq: ["$studentViewed", false] }
                  ]
                },
                1,
                0
              ]
            }
          },
          inProgress: {
            $sum: {
              $cond: [{ $eq: ["$status", "in-progress"] }, 1, 0]
            }
          },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0]
            }
          }
        }
      }
    ]);

    const overallStats = {
      total: stats.reduce((acc, curr) => acc + (curr.total || 0), 0),
      new: stats.reduce((acc, curr) => acc + (curr.new || 0), 0),
      inProgress: stats.reduce((acc, curr) => acc + (curr.inProgress || 0), 0),
      completed: stats.reduce((acc, curr) => acc + (curr.completed || 0), 0)
    };

    return { domainStats: stats, overallStats };
  } catch (error) {
    console.error("Error calculating stats:", error);
    return { domainStats: [], overallStats: { total: 0, new: 0, inProgress: 0, completed: 0 } };
  }
}

// Change Stream setup
const setupChangeStream = async () => {
  try {
    if (changeStream) changeStream.close();

    changeStream = Client.watch();
    
    changeStream.on('change', async (change) => {
      console.log('🔄 Change detected:', change.operationType);
      const stats = await calculateDomainStats();
      
      io.emit('stats-updated', stats);
      
      switch (change.operationType) {
        case 'insert':
          io.emit('new-student', change.fullDocument);
          break;
        case 'update':
          io.emit('student-updated', change.documentKey._id);
          break;
        case 'delete':
          io.emit('student-deleted', change.documentKey._id);
          break;
      }
    });

    changeStream.on('error', (error) => {
      console.error('Change stream error:', error);
      setTimeout(setupChangeStream, 5000);
    });
  } catch (error) {
    console.error('Error setting up change stream:', error);
  }
};

// Socket connection
io.on('connection', (socket) => {
  console.log('📡 Client connected:', socket.id);
  
  socket.on('request-stats', async () => {
    const stats = await calculateDomainStats();
    socket.emit('initial-stats', stats);
  });

  calculateDomainStats().then(stats => {
    socket.emit('initial-stats', stats);
  });

  socket.on('disconnect', () => {
    console.log('📡 Client disconnected:', socket.id);
  });
});

// Routes
app.use("/api/clients", clientRoutes);
app.use("/api/counselor", counselorRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ 
    status: 'ok', 
    dbConnected,
    timestamp: new Date().toISOString()
  });
});

// Connect to MongoDB
connectDB();

// Export for Vercel
module.exports = app;