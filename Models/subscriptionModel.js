const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
    enum: ['1 day', '1 month', '3 months', '6 months', '1 year'],
  },
  price: {
    type: Number,
    required: true,
  },
  renewalType: {
    type: String,
    // required: true,
    enum: ['automatic', 'manual'],
    default:'manual',
  },
  // Add other plan-specific benefits here (e.g., number of guest passes, free PT sessions)
});

const Subscription = mongoose.model('Subscription', SubscriptionSchema)

module.exports = Subscription;
