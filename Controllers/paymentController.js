const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const Payment = require('../Models/paymentModel');
const User = require('../Models/userModel');
const Subscription = require('../Models/subscriptionModel');
const axios = require('axios');
const schedule = require('node-schedule')

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

const verifyFlutterwaveSignature = (req) => {
    const signature = req.headers['verif-hash'] || req.headers['Flutterwave-Event']; // Check for both headers
    if (!signature) {
      return false;
    }
  
    const secretHash = FLUTTERWAVE_WEBHOOK_SECRET.toString(); // Ensure secret is a string
    const hash = crypto.createHmac('sha256', secretHash)
      .update(JSON.stringify(req.body, null, 2)) // Stringify with UTF-8 encoding
      .digest('hex');
      console.log(hash)
  
    return hash === signature;
  };
  
// Create Payment
const createPayment = asyncHandler(async (req, res) => {
  const { userId, subscriptionId } = req.body;

  try {
      const user = await User.findById(userId);
      const subscription = await Subscription.findById(subscriptionId);

      if (!user || !subscription) {
          res.status(404).json({ error: 'User or Subscription not found' });
          return;
      }

      const amount = subscription.price; // Fetch the amount from the subscription

      const payment = new Payment({
          userId,
          subscriptionId,
          amount,
          status: 'pending'
      });

      const savedPayment = await payment.save();

      const paymentData = {
          tx_ref: savedPayment._id.toString(),
          amount: savedPayment.amount,
          currency: 'NGN',
          redirect_url: 'http://localhost:5200/', // Make sure this URL is correct and accessible
          customer: {
              email: user.email,
              phonenumber: user.phoneNumber,
              name: user.fullName
          },
          customizations: {
              title: 'Subscription Payment',
              description: `Payment for ${subscription.name}`,
              logo: 'YOUR_LOGO_URL'
          }
      };

      const response = await axios.post('https://api.flutterwave.com/v3/payments', paymentData, {
          headers: {
              Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`  
          }
      });

      res.json({ paymentLink: response.data.data.link });
  } catch (error) {
      console.error('Payment creation error:', error.response ? error.response.data : error.message);
      res.status(500).json({ error: 'Payment creation failed' });
  }
});

// Helper function to calculate end date based on subscription duration
const calculateEndDate = (startDate, duration) => {
    const endDate = new Date(startDate);
    switch (duration) {
        case '1 day':
            endDate.setDate(endDate.getDate() + 1);
            break;
        case '1 month':
            endDate.setMonth(endDate.getMonth() + 1);
            break;
        case '3 months':
            endDate.setMonth(endDate.getMonth() + 3);
            break;
        case '6 months':
            endDate.setMonth(endDate.getMonth() + 6);
            break;
        case '1 year':
            endDate.setFullYear(endDate.getFullYear() + 1);
            break;
        default:
            throw new Error('Invalid subscription duration');
    }
    return endDate;
};

const handleWebhook = asyncHandler(async (req, res) => {
    // if (!verifyFlutterwaveSignature(req)) {
    //   return res.status(400).json({ error: 'Invalid signature' });
    // }
  
    const { tx_ref, status, flw_ref, payment_type, id: transaction_id, created_at } = req.body.data;
  
    const payment = await Payment.findById(tx_ref);
  
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
  
    // Check if the payment status is already 'success' to avoid reprocessing
    if (payment.status === 'success') {
      return res.status(200).send('Payment already processed successfully');
    }
  
    try {
      if (status !== 'successful') {
        throw new Error('Payment failed');
      }
  
      const user = await User.findById(payment.userId);
      if (!user) {
        throw new Error('User not found');
      }
  
      const subscription = await Subscription.findById(payment.subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }
  
      const startDate = new Date();
      const endDate = calculateEndDate(startDate, subscription.duration);
  
      // Update payment status to success and add additional information
      payment.status = 'success';
      payment.paymentReference = flw_ref;
      payment.paymentMethod = payment_type;
      payment.transactionId = transaction_id;
      payment.transactionDate = new Date(created_at);
      await payment.save();
  
      // Find or create the subscription details in user's subscriptions array
      const subscriptionIndex = user.subscriptions.findIndex(sub => sub.subscriptionId.toString() === payment.subscriptionId.toString());
  
      if (subscriptionIndex === -1) {
        user.subscriptions.push({
          subscriptionId: payment.subscriptionId,
          startDate,
          endDate,
          status: 'active'
        });
      } else {
        user.subscriptions[subscriptionIndex].status = 'active';
        user.subscriptions[subscriptionIndex].startDate = startDate;
        user.subscriptions[subscriptionIndex].endDate = endDate;
      }
  
      await user.save();
  
      // Schedule a job to handle membership expiration
      schedule.scheduleJob(endDate, async () => {
        const now = new Date();
        if (now >= endDate) {
          const subToUpdate = user.subscriptions.find(sub => sub.subscriptionId.toString() === payment.subscriptionId.toString());
          if (subToUpdate && subToUpdate.status === 'active') {
            subToUpdate.status = 'inactive';
            await user.save(); // Save the updated user document
  
            // Log or notify about the state change
            console.log(`Subscription ${subscription.name} for user ${user.username} has expired and set to inactive.`);
          }
        }
      });
  
      res.status(200).send('Webhook handled successfully');
    } catch (error) {
      payment.status = 'failed';
      await payment.save();
      return res.status(400).json({ error: error.message });
    }
  });

const getUserPaymentHistory = asyncHandler(async (req, res) => {
    const userId = req.params.userId;

    // Find the user first
    const user = await User.findById(userId).populate({
        path: 'subscriptions.subscriptionId',
        select: 'name duration price'
    });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Construct the payment history
    const paymentHistory = await Payment.find({ userId }).populate('subscriptionId', 'name duration price');
    
    // Merge payment history with subscription details
    const history = paymentHistory.map(payment => {
        const userSubscription = user.subscriptions.find(sub => sub.subscriptionId && sub.subscriptionId._id.toString() === payment.subscriptionId._id.toString());
        return {
            paymentId: payment._id,
            subscription: payment.subscriptionId,
            amount: payment.amount,
            status: payment.status,
            paymentDate: payment.createdAt,
            startDate: userSubscription ? userSubscription.startDate : null,
            endDate: userSubscription ? userSubscription.endDate : null,
            subscriptionStatus: userSubscription ? userSubscription.status : 'unknown'
        };
    });

    if (history.length === 0) {
        return res.status(404).json({ error: 'No payments found for this user' });
    }

    res.status(200).json(history);
});

const getAllUsersPaymentHistory = asyncHandler(async (req, res) => {
    // Fetch all payments with user and subscription details populated
    const payments = await Payment.find()
        .populate('userId', 'username email')
        .populate('subscriptionId', 'name duration price');

    if (!payments || payments.length === 0) {
        return res.status(404).json({ error: 'No payments found' });
    }

    // Get a list of unique userIds from the payments
    const userIds = [...new Set(payments.map(payment => payment.userId._id.toString()))];

    // Fetch users with their subscriptions
    const users = await User.find({ _id: { $in: userIds } }).populate({
        path: 'subscriptions.subscriptionId',
        select: 'name duration price'
    });

    // Create a map of userId to user for quick lookup
    const userMap = users.reduce((map, user) => {
        map[user._id.toString()] = user;
        return map;
    }, {});

    // Merge payment history with user subscription details
    const history = payments.map(payment => {
        const user = userMap[payment.userId._id.toString()];
        const userSubscription = user.subscriptions.find(sub => sub.subscriptionId && sub.subscriptionId._id.toString() === payment.subscriptionId._id.toString());

        return {
            paymentId: payment._id,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
            subscription: payment.subscriptionId,
            amount: payment.amount,
            status: payment.status,
            paymentDate: payment.createdAt,
            startDate: userSubscription ? userSubscription.startDate : null,
            endDate: userSubscription ? userSubscription.endDate : null,
            subscriptionStatus: userSubscription ? userSubscription.status : 'unknown'
        };
    });

    res.status(200).json(history);
});

module.exports = {
    createPayment,
    handleWebhook,
    getUserPaymentHistory,
    getAllUsersPaymentHistory
};
