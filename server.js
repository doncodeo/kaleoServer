const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv').config();
const connectDB = require('./config/db');
const path = require('path');

const app = express();
const port = process.env.PORT || 5200;

// Main function to start the server
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    // console.log('MongoDB connected!');

    // Enable CORS
    const allowedOrigins = [
      'http://localhost:5174',
      // Add any other origins as needed
    ];
    app.use(cors({ origin: allowedOrigins }));

    // Middleware for JSON and URL-encoded data
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));

    // Routes
    app.use('/api/user', require('./Routes/userRoute'));
    app.use('/api/subscription', require('./Routes/subscriptionRoute')); 
    app.use('/api/payment', require('./Routes/paymentRoute'));

    // Serve static files from the 'public' directory (optional)
    app.use(express.static(path.join(__dirname, 'public')));

    // Serve index.html for any other route (excluding OPTIONS method)
    app.get('*', (req, res) => {
      if (req.method !== 'OPTIONS') {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
      }
    });

    // Start the server
    app.listen(port, () => console.log(`Server started on port ${port}`));
  } catch (error) {
    console.error('Error starting the server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

// Handling uncaught exceptions and unhandled rejections
process.on('uncaughtException', (err) => {
  console.error(`Uncaught Exception: ${err}`);
  process.exit(1); // Exit the process with failure
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1); // Exit the process with failure
});


