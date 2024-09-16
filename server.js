const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv').config();
const connectDB = require('./config/db');
const path = require('path');
const userData = require('./Models/userModel');
const moment = require('moment'); // moment for date comparisons
const cron = require('node-cron');
const { sendBirthdayEmail, expiredSubscriptionMail } = require('./Middleware/emailService'); 

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
      'http://localhost:5173',
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

 
    cron.schedule('* * * * *', async () => { //updates every DAY
      console.log('Running cron job to update expired subscriptions...');
    
      try {
        // Get the current date
        const now = new Date();
        console.log('Current date:', now);
    
        // Find users with active subscriptions whose end date has passed
        const users = await userData.find({ 'subscriptions.status': 'active' });
        console.log('Active users found:', users.length);
    
        for (const user of users) {
          console.log('Processing user:', user._id);
    
          for (const subscription of user.subscriptions) {
            console.log('Checking subscription:', subscription);
    
            if (subscription.status === 'active' && subscription.endDate < now) {
              // Update subscription status to 'inactive'
              console.log('Updating subscription to inactive:', subscription);
              subscription.status = 'inactive';
            }
          }
    
          // Save the updated user document
          await user.save();
          expiredSubscriptionMail(user);
          console.log('User saved successfully:', user._id);
        }
    
        console.log('Subscription status updated successfully.');
      } catch (error) {
        console.error('Error updating subscriptions:', error);
      }
    });


    // New cron job for sending birthday emails
    cron.schedule('0 7 * * *', async () => { // Runs every day at at 7AM
      console.log('Running cron job to send birthday emails...');
      
      try {
        // Get the current month and day
        const today = new Date();
        const month = today.getMonth() + 1; // Months are zero-based, so add 1
        const day = today.getDate();
    
        // Find users whose birthday is today
        const users = await userData.aggregate([
          {
            $addFields: {
              month: { $month: "$DOB" },
              day: { $dayOfMonth: "$DOB" }
            }
          },
          {
            $match: {
              month: month,
              day: day
            }
          }
        ]);
    
        console.log('Users with birthdays today:', users.length);
    
        for (const user of users) {
          console.log('Sending birthday email to:', user.email);
          await sendBirthdayEmail(user);
        }
    
        console.log('Birthday emails sent successfully.');
      } catch (error) {
        console.error('Error sending birthday emails:', error);
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


