//This file handle MongoDB connection using Mongoose
const mongoose = require('mongoose');

// I wrote this funtion to handle the MongoDB connection separately so that server.js stays clean
const connectDB = async () => {
    // I'm using try/catch here because mongoose.connect can fail
    // for example if the MONGO_URI is wrong or Atlas is down
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        
        // simple message so I know in the terminal that it worked
        console.log(`MongoDB Connected Successfully at ${conn.connection.host}`);

    } catch (error) {
        // error msg so I can see what actually went wrong
        console.error(`MongoDB connection Error: ${error.message}`);
        // exit the process if DB connection fails
        process.exit(1);
    }
};

module.exports = connectDB;