const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({

    // The visitor who is coming
    visitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Visitor',
        required: true
    },

    // The host employee who will receive the visitor
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Date and Time of the visit
    visitDate: {
        type: Date,
        required: true
    }, 
    visitTime: {
        type: String,
        required: true
    },

    // current status of the appointment
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'expired', 'completed'],
        default: 'pending',
    },

    // Reason is rejected
    rejectionReason: {
        type: String,
        default: '',
    },

    // When was the approved/rejected/completed/cancelled and by whom
    actionBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    actionAt: {
        type: Date,
    },
    purpose: {
        type: String,
        default: '',
    },
    notes: {
        type: String,
        default: '',
    },
}, {
    timestamps: true
});

module.exports = mongoose.model('Appointment', appointmentSchema);
