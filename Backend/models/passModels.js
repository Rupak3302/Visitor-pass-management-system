const mongoose = require('mongoose');

const passSchema = new mongoose.Schema({
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true
    },
    qrCodeData: {
        type: String,
        required: true // The unique string hidden inside the QR code image
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'revoked'],
        default: 'active'
    },
    validUntil: {
        type: Date,
        // required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Pass', passSchema);