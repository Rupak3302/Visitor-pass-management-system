const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
    organizationName: {
        type: String,
        required: true,
        default: 'Main Company' 
    },
    name: {
        type: String,
        required: [true, 'Visitor name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, 'Phone number is required'],
    },
    purpose: {
        type: String,
        default: '',
    },
    company: {
        type: String,
        default: '',
    },
    photoUrl: {
        type: String,
        default: '',
    },
    // References the user model (only employees(hosts) / admin users)
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    registerBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    notes: {
        type: String,
        default: '',
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Visitor', visitorSchema);