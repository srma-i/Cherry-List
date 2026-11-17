
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { socketService } from './services/socketService.js';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Import routes
import tasksRouter from './routes/tasks.js';
import authRouter from './routes/auth.js';
import waterReminderRouter, {
  initializeWaterReminders
} from './routes/waterReminder.js';
import activityLogRouter from './routes/activityLog.js';
import pushRouter from './routes/push.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Allowed frontend origins
const allowedOrigins = [
  'https://cherry-list.vercel.app',
  'https://cherry-frontend-xtvi.onrender.com',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests without an Origin header
    if (!origin) {
      return callback(null, false);
    }

    // Explicitly return the matching allowed origin
    if (allowedOrigins.includes(origin)) {
      return callback(null, origin);
    }

    console.error('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },

  credentials: true,

  methods: [
    'GET',
    'POST',
    'PUT',
    'DELETE',
    'PATCH',
    'OPTIONS'
  ],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'x-auth-token'
  ],

  optionsSuccessStatus: 204
};

// Apply CORS middleware before all routes
app.use(cors(corsOptions));

// Parse JSON requests
app.use(express.json());

// MongoDB connection
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('MONGODB_URI environment variable is not defined');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

connectDB();

// API routes
app.use('/api/tasks', tasksRouter);
app.use('/api/auth', authRouter);
app.use('/api/water-reminder', waterReminderRouter);
app.use('/api/activity-log', activityLogRouter);
app.use('/api/push', pushRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    message: 'Server is running!'
  });
});

// Create HTTP server and initialize Socket.IO
const server = createServer(app);

socketService.initialize(server);

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('WebSocket server initialized');
});
