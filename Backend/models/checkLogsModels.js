const mongoose = require('mongoose');

const checkLogSchema = new mongoose.Schema({
    passId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pass',
        required: true
    },
    visitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Visitor',
        required: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    scannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // the security who scanned the visitor
        required: true
    },
    checkInTime: {
        type: Date,
        default: Date.now
    },
    checkOutTime: {
        type: Date,
    },
    status: {
        type: String,
        enum: ['Inside', 'Inactive'], // Inside = checked_in, Inactive = checked_out
        default: 'Inside'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CheckLog', checkLogSchema);