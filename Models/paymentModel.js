const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    subscriptionId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Subscription'
    },
    amount: {
        type: Number,
        required: true
    },
    paymentReference: { type: String },
    paymentMethod: { type: String },
    transactionId: { type: String },
    transactionDate: { type: Date },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Payment', PaymentSchema);
