// Import the necessary packages we installed
const express = require('express'); // backend framework
const dotenv = require('dotenv'); // for environment variables
const mongoose = require('mongoose'); // MongoDB connection 
const cors = require('cors'); // allow forntend-backend communication
const connectDB = require('./config/db'); // our MongoDB connection function

// Import the route files
const userRoutes = require('./routes/userRoutes'); // user-related routes
const visitorRoutes = require('./routes/visitorRoutes'); // visitor-related routes
// const appointmentRoutes = require('./routes/appointmentRoutes'); // appointment-related routes
// const checkLogsRoutes = require('./routes/checkLogsRoutes'); // check logs-related 
const path = require('path');
const { config } = require('dotenv');


dotenv.config(); // Load environment variables from .env file

// Initialize the Express app
const app = express();

// Connect to MongoDB
connectDB();

// Middleware Setup 
// allows us to JSON data from frontend 
app.use(express.json());
// allows cross-origin requests (from frontend to backend)
app.use(cors());


// Use the user routes (login, register, get users)
app.use('/api/user', userRoutes);
// Use the visitor routes
app.use('/api/visitors', visitorRoutes);
// Use the appointment routes
// app.use('/api/appointments', appointmentRoutes);
// Use the check logs routes
// app.use('/api/checklogs', checkLogsRoutes);
//allow to view the image
app.use('/uploads', 
    express.static(path.join(__dirname, 'uploads'))
);


// Test route to check if the server is running
app.get('/', (req, res) => {
    res.send('backend is running successfully!');
});


// Start the server
const PORT = process.env.PORT || 5000; 

app.listen(PORT, () => {
    console.log(`Visitor Pass Management API is running...http://localhost:${PORT}`);
});