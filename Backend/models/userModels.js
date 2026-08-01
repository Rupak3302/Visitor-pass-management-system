const mongoose = require('mongoose');

// This is the schema for the User collection (Admin, Security, Host) in MongoDB
const userSchema = new mongoose.Schema({
    organizationName: {
        type: String,
        required: true,
        default: 'Main Company' 
    },
    name: {
        type: String,
        required: [true, 'Name is required'], 
        trim: true, // Removes extra spaces
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true, // email must be unique to prevent duplicate accounts
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false, // password won't be returned in queries by default
    },
    role: {
        type: String,
        enum: ['admin', 'security', 'host'], // role must be one of these three roles
        default: 'host', // default role is host if not specified
    },
    phone: {
        type: String,
        default: '',
    },
    isActive: {
        type: Boolean,
        default: true, // admin can deactivate accounts 
    }
}, {
    timestamps: true // Automatically adds 'createdAt' and 'updatedAt' dates
});

// Export the User model, so we can use it in our controllers 
module.exports = mongoose.model('User', userSchema);
