const jwt = require('jsonwebtoken');
const user = require('../models/userModels');

//Protect Middleware function to protect routes and ensure the user is authenticated
const protect = async (req, res, next) => {
    let token;

    // Check if the request has an "authorization" token
    // Authorization: "Bearer <token>"
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Split the string to get the token part
            token = req.headers.authorization.split(' ')[1];

            // Decode and verify the token
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET
            );

            // Find the user in DB based on the decoded token's user ID
            // .select('-password') ensures we don't accidentally send the password back in the response
            req.user = await user.findById(decoded.id).select('-password');

            // if (!req.user) {
            //     return res.status(401).json({
            //         message: 'User not found, token is invalid'
            //     });
            // }

            // If everything is good, call next() to move on to the next middleware or route handler
            next();
            
        } catch (error) {
            console.error('Token verification failed:', error.message);
            return res.status(401).json({
                message: 'Not authorized, token failed'
            });
        }
    }

    if (!token) {
        return res.status(401).json({
            message: 'Not authorized, no token provided'
        });
    }
};

// Role-based authorize middleware 
// This '...roles' syntax takes any roles we pass in and puts them into an array
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        
        //req.user is set by the protect middleware
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access Denied: Your role (${req.user.role}) is not allowed here`
            });
        }
        // if their roles is in the array, let them pass
        next();
    };
};

module.exports = { protect, authorizeRoles };