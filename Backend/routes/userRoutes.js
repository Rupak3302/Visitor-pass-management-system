const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');


// Import the user controller functions
const { loginUser, registerUser, getUserById, } = require('../controllers/userController');

const { protect } = require('../middleware/authMiddleware'); // Import the auth middleware for protected routes


// when a POST request is made to the /login endpoint, run the loginUser function 
router.post('/login', loginUser);

// when a POST request is made to the /register endpoint, run the registerUser function
router.post('/register', registerUser);

// when a GET request is made to the /users endpoint ,run the getUsers function
router.get('/users/:id', protect, getUserById);


// ** Admin system routes **
router.get('/admin/all', protect, userController.getAllUsers);
router.patch('/admin/status/:id', protect, userController.UpdateUserStatus);
router.delete('/admin/delete/:id', protect, userController.deleteUser);

module.exports = router;