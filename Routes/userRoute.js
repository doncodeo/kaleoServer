const express = require('express');
const router = express.Router();
const {protect, adminOnly, errorHandler} = require('../Middleware/authMiddleWare');

const {
    registerUser,
    createUser,
    getUsers,
    loginUser,
    logoutUser,
    deleteUser,
    updateUser
} = require('../Controllers/userController');

router.route('/').get(protect, adminOnly, getUsers).post(registerUser);
router.route('/create').post(protect, adminOnly, createUser);
router.route('/login').post(loginUser); 
router.route('/logout').get(logoutUser);  
router.route('/:id').delete(protect, adminOnly, deleteUser);    
router.route('/update/:id').put(protect, adminOnly, updateUser); 



// Use the errorHandler middleware
router.use(errorHandler);

module.exports = router  
