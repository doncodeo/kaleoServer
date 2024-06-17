const express = require('express');
const router = express.Router();
const {protect, adminOnly, superAdminOnly, errorHandler} = require('../Middleware/authMiddleWare');

const {
    registerUser,
    createUser,
    getUsers,
    loginUser,
    logoutUser,
    deleteUser,
    updateUser,
    getUsersBySubscription,
    initiatePasswordReset,
    resetPassword,
    updatePassword,
    getUserById,
} = require('../Controllers/userController');

router.route('/').get(protect, adminOnly, getUsers).post(registerUser);
router.route('/:id').get(protect, adminOnly, getUserById).delete(protect, superAdminOnly, deleteUser);    
router.route('/user-sub/:id').get(protect, adminOnly, getUsersBySubscription)
router.route('/update-password/:id').put(updatePassword);
router.route('/create').post(protect, adminOnly, createUser);
router.route('/login').post(loginUser); 
router.route('/logout').get(logoutUser);  
router.route('/update/:id').put(protect, adminOnly, updateUser); 
router.route('/passwordreset').post(initiatePasswordReset);
router.route('/passwordreset/:token').post(resetPassword)


// Use the errorHandler middleware
router.use(errorHandler);

module.exports = router  
