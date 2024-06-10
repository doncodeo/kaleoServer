const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    required: true
  },
  DOB: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  address: {
    type: String,
    // required: true
  },
  disability: {
    type: String,
    required: true,
    enum: ['yes', 'no'],
    default: 'no'
  },
  profileImage: {
    type: String
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'superAdmin'],
    default: 'user'
  }, 
  membershipPlan: {
    type: String, 
    enum: ['single', 'couples', 'organization, group'],
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
    required: true,
  },
  membershipStatus: {
    type: String,
    // required: true,
    enum: ['active', 'inactive', 'expired'],
  },
  startDate: {
    type: Date,
    // required: true
  },
  endDate:{
    type: Date
  },
  // payment methods and process
  paymentMethod: {
    type: String, 
    enum: ['cash', 'transfer', 'paypal'], 
  },
  
  // Emmergency contact
  iceName: {
    type: String
  },
  iceNumber: {
    type: String
  }

}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

module.exports = User;
    