const asyncHandler = require('express-async-handler');
const User = require('../Models/userModel');

// Clock in function
const clockIn = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user has an active subscription
    const hasActiveSubscription = user.subscriptions.some(sub => sub.status === 'active');
    if (!hasActiveSubscription) {
      return res.status(400).json({ error: 'User does not have an active subscription' });
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if user already clocked in today
    const todayAttendance = user.attendance.find(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });

    if (todayAttendance) {
      return res.status(400).json({ error: 'User has already clocked in today' });
    }

    // Add new clock-in record
    user.attendance.push({
      date: new Date(),
      clockInTime: new Date(),
    });

    await user.save();

    res.status(200).json({ success: true, message: 'Clock-in successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Clock out function
const clockOut = asyncHandler(async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find today's attendance record
    const todayAttendance = user.attendance.find(record => {
      const recordDate = new Date(record.date);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });

    if (!todayAttendance) {
      return res.status(400).json({ error: 'User has not clocked in today' });
    }

    if (todayAttendance.clockOutTime) {
      return res.status(400).json({ error: 'User has already clocked out today' });
    }

    // Update the clock-out time
    todayAttendance.clockOutTime = new Date();

    await user.save();

    res.status(200).json({ success: true, message: 'Clock-out successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = {
  clockIn,
  clockOut,
};
