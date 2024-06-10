const express = require('express');
const router = express.Router();
const { 
    createPayment,
    handleWebhook,
    getUserPaymentHistory,
    getAllUsersPaymentHistory,
 } = require('../Controllers/paymentController');

router.route('/').get(getAllUsersPaymentHistory).post(createPayment);
router.route('/:userId').get(getUserPaymentHistory);

router.route('/webhook').post(handleWebhook);



module.exports = router;
