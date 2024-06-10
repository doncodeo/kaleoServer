const asyncHandler = require('express-async-handler');
const subscriptionData = require('../Models/subscriptionModel');
const userData = require('../Models/userModel');

const createSubscription = asyncHandler(async (req, res) => {
  try {
    const { name, duration, price, renewalType } = req.body;

    // Validate required fields
    if (!name || !duration || !price) {
      res.status(400).json({ error: 'Please provide all required fields' });
      return;
    }
    // Check for valid duration
    const validDurations = ['1 day', '1 month', '3 months', '6 months', '1 year'];
    if (!validDurations.includes(duration)) {
      res.status(400).json({ error: 'Invalid duration. Choose from: ' + validDurations.join(', ') });
      return;
    }

    // Handle optional renewalType (make it non-required in the schema)
    // renewalType = renewalType || 'manual'; // Set default to manual if not provided

    // Create new subscription
    const newSubscription = new subscriptionData({
      name,
      duration,
      price,
      renewalType,
    });

    const savedSubscription = await newSubscription.save();

    res.status(201).json({ success: true, subscription: savedSubscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

const deleteSubscription = asyncHandler(async (req, res) => {
  try {
      const subscriptionId = req.params.id;

      // Find the subscription by ID
      const subscription = await subscriptionData.findById(subscriptionId);

      if (!subscription) {
          res.status(404).json({ error: 'Subscription not found' });
          return;
      }

      // Delete the subscription
      await subscription.deleteOne();

      // Remove the subscription from all users
      await userData.updateMany({ subscription: subscriptionId }, { $unset: { subscription: "" } });

      res.status(200).json({ success: true, message: 'Subscription deleted successfully and removed from users' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
  }
});

// const deleteSubscription = asyncHandler(async (req, res) => {
//   try {
//     const subscriptionId = req.params.id;

//     // Find the subscription by ID
//     const subscription = await subscriptionData.findById(subscriptionId);

//     if (!subscription) {
//       res.status(404).json({ error: 'Subscription not found' });
//       return;
//     }

//     // Delete the subscription
//     await subscription.deleteOne();

//     res.status(200).json({ success: true, message: 'Subscription deleted successfully' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

const updateSubscription = asyncHandler(async (req, res) => {
  try {
    const subscriptionId = req.params.id;
    const updates = req.body;

    // Find the subscription by ID
    let subscription = await subscriptionData.findById(subscriptionId);

    // Check if the subscription exists
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    // Update subscription details (including renewalType)
    subscription = Object.assign(subscription, updates); // Concise object assignment

    // Save the updated subscription
    subscription = await subscription.save();

    res.status(200).json({ success: true, subscription });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

const getAllSubscriptions = asyncHandler(async (req, res) => {
  try {
    // Find all subscriptions
    const subscriptions = await subscriptionData.find();

    // Return all subscriptions
    res.status(200).json({ success: true, subscriptions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


module.exports = {
    createSubscription,
    deleteSubscription,
    updateSubscription,
    getAllSubscriptions
}

