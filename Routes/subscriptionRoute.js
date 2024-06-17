const express = require('express');
const router = express.Router();
const {
    protect, 
    adminOnly, 
    superAdminOnly, 
    errorHandler} = require('../Middleware/authMiddleWare');

const {
    createSubscription,
    deleteSubscription,
    updateSubscription,
    getAllSubscriptions 
} = require('../Controllers/subscriptionController');

router.route('/').get(getAllSubscriptions).post( createSubscription);
router.route('/:id').put(protect, superAdminOnly, updateSubscription).delete(protect, superAdminOnly, deleteSubscription);

router.use(errorHandler);

module.exports = router  
