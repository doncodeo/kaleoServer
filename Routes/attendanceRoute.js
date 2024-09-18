const express = require('express');
const { clockIn, clockOut, getUsersClockedIn} = require('../Controllers/attendanceController');
const router = express.Router();
const {protect, adminOnly, superAdminOnly, errorHandler} = require('../Middleware/authMiddleWare');


router.route('/in/:userId').post(protect, adminOnly, clockIn)
router.route('/out/:userId').post(protect, adminOnly, clockOut)
router.route('/').get(getUsersClockedIn);


module.exports = router;
