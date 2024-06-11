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
  
    return hash === signature;
  };
  

// Create Payment
const createPayment = asyncHandler(async (req, res) => {
    const { userId, subscriptionId } = req.body;

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
        // redirect_url: 'http://localhost:5200/payment-success',
        redirect_url: '  https://c94c-102-91-14-146.ngrok-free.app/payment-success',

        customer: {
            email: user.email,
            phonenumber: user.phoneNumber,
            name: `${user.firstName} ${user.lastName}`
        },
        customizations: {
            title: 'Subscription Payment',
            description: `Payment for ${subscription.name}`,
            logo: 'YOUR_LOGO_URL'
        }
    }; 

    const response = await axios.post('https://api.flutterwave.com/v3/payments', paymentData, {
        headers: {
            Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`
        }
    });

    res.json({ paymentLink: response.data.data.link });
}); 


const handleWebhook = asyncHandler(async (req, res) => {
    const { tx_ref, status } = req.body.data;

    const payment = await Payment.findById(tx_ref);

    if (!payment) {
        res.status(404).json({ error: 'Payment not found' });
        return;
    }

    // Check if the payment status is already 'success' to avoid reprocessing
    if (payment.status === 'success') {
        res.status(200).send('Payment already processed successfully');
        return;
    }

    payment.status = status === 'successful' ? 'success' : 'failed';
    await payment.save();

    if (payment.status === 'success') {
        const user = await User.findById(payment.userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const subscription = await Subscription.findById(payment.subscriptionId);
        if (!subscription) {
            res.status(404).json({ error: 'Subscription not found' });
            return;
        }

        user.membershipStatus = 'active';
        user.startDate = new Date();

        // Calculate the end date based on subscription duration
        let endDate = new Date();
        switch (subscription.duration) {
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
        user.endDate = endDate;

        await user.save();

        // Schedule a job to handle membership expiration
        schedule.scheduleJob(endDate, async () => {
            const now = new Date();
            if (now > user.endDate) {
                // Membership has expired
                if (subscription.renewalType !== 'automatic') {
                    // Set membership status to inactive for manual renewal
                    user.membershipStatus = 'inactive';
                    await user.save();
                }
            }
        });
    }

    res.status(200).send('Webhook handled successfully');
});

const getUserPaymentHistory = asyncHandler(async (req, res) => {
    const userId = req.params.userId;

    const payments = await Payment.find({ userId }).populate('subscriptionId', 'name duration price');
    if (!payments || payments.length === 0) {
        res.status(404).json({ error: 'No payments found for this user' });
        return;
    }

    res.status(200).json(payments);
});

const getAllUsersPaymentHistory = asyncHandler(async (req, res) => {
    const payments = await Payment.find().populate('userId', 'username email').populate('subscriptionId', 'name duration price');
    if (!payments || payments.length === 0) {
        res.status(404).json({ error: 'No payments found' });
        return;
    }

    res.status(200).json(payments);
});

module.exports = {
    createPayment,
    handleWebhook,
    getUserPaymentHistory,
    getAllUsersPaymentHistory
};
