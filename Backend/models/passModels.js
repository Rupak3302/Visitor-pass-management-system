const mongoose = require('mongoose');

const passSchema = new mongoose.Schema({
    organizationName: {
        type: String,
        required: true,
        default: 'Main Company' 
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment',
        required: true
    },
    visitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Visitor',
        required: true
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    qrCodeData: {
        type: String,
        required: true // I used base64 image string QR code which will store here
    },
    passCode: {
        type: String, // A unique 6-digit text code as a backup if the Qr code is won't scan
        required: true,
        unique: true
    },
    validFrom: {
        type: Date,
        required: true
    },
    validUntil: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true // default true if expiry or after check-out false 
    },
    status: {
        type: String,
        enum: ['active', 'expired', 'inactive'],
        default: 'active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Pass', passSchema);