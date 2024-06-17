const express = require('express');
const router = express.Router();
const {protect, adminOnly, superAdminOnly, errorHandler} = require('../Middleware/authMiddleWare');

const { 
    createPayment,
    handleWebhook,
    getUserPaymentHistory,
    getAllUsersPaymentHistory,
 } = require('../Controllers/paymentController');

router.route('/').get(protect, adminOnly, getAllUsersPaymentHistory).post(createPayment);
router.route('/:userId').get(protect, getUserPaymentHistory);
router.route('/webhook').post(handleWebhook);

module.exports = router;
