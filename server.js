const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();

// Updated CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'https://project-tracking.vercel.app'
    ];
    callback(null, true); // Allow all origins during development
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Add preflight handler
app.options('*', cors());

app.use(bodyParser.json());
app.use(express.json());

// Connect to Database
connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/progress', require('./routes/progressRoutes'));
app.use('/api/candidates', require('./routes/candidateRoutes'));

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Project Management System API' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 