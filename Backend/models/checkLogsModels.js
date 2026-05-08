const mongoose = require('mongoose');

const checkLogSchema = new mongoose.Schema({
    passId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Pass',
        required: true
    },
    scannedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    checkInTime: {
        type: Date,
        default: Date.now // automatically logs the exact moment it was scanned
    },
    checkOutTime: {
        type: Date,
        default: null // checkOutTime will be null until the visitor checks out, then it will be updated with the actual time
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CheckLog', checkLogSchema);