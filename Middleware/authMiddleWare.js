const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const userData = require('../Models/userModel');

const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // get user from the token 
            req.user = await userData.findById(decoded.id).select('-password');

            if (!req.user) {
                throw new Error("User not found");
            }

            next();
        } catch (error) {
            console.log(error);
            res.status(401).json({ error: "You are not authorized to access this resource" });
        }
    } else {
        res.status(401).json({ error: 'Not authorized, no token' });
    }
});

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Not authorized, only admin users can access this resource' });
    }
};

const superAdminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'superAdmin') {
        next();
    } else {
        res.status(403);
        throw new Error('Not authorized, only superAdmin users can access this resource');
    }
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Server error' });
};

module.exports = {
    protect,
    adminOnly,
    superAdminOnly,
    errorHandler,
};




// const jwt = require('jsonwebtoken');
// const asyncHandler = require('express-async-handler');
// const userData = require('../Models/userModel');

// const protect = asyncHandler(async (req, res, next) => {
//     let token;

//     if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
//         try {
//             // get token from header
//             token = req.headers.authorization.split(' ')[1];

//             // Verify token
//             const decoded = jwt.verify(token, process.env.JWT_SECRET);

//             // get user from the token 
//             req.user = await userData.findById(decoded.id).select('-password');

//             next();
//         } catch (error) {
//             console.log(error);
//             res.status(401);
//             throw new Error("You are not authorized to access this resource");
//         }
//     }

//     if (!token) {
//         res.status(401);
//         throw new Error('Not authorized, no token');
//     }
// });

// const adminOnly = (req, res, next) => {
//     if (req.user && req.user.role === 'admin') {
//         next();
//     } else {
//         res.status(403);
//         throw new Error('Not authorized, only admin users can access this resource');
//     }
// };

// module.exports = {
//     protect,
//     adminOnly,
// };


