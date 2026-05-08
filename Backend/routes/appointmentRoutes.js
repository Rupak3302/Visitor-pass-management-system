const express = require('express');
const router = express.Router();

const { 
    scheduleAppointment, 
    getAppointments, 
    updateAppointmentStatus,
    downloadBadge
} = require('../controllers/appoinmentController');


const { 
    protect, 
    authorizeRoles 
} = require('../middleware/authMiddleware');


// Route: POST /api/appointments
// Only Admin and Host can create invites
router.post(
    '/',
    protect,
    authorizeRoles('admin', 'host'),
    scheduleAppointment
);

// Route: GET /api/appointments
// Everyone logged in can view, but the controller filters based on role
router.get(
    '/',
    protect,
    authorizeRoles('admin', 'security', 'host'),
    getAppointments
);

// Route: PUT /api/appointments/:id/status
// Only Admin and Host can update status
router.put(
    '/:id/status',
    protect,
    authorizeRoles('admin', 'host'),
    updateAppointmentStatus
);

// GET /api/appointment/:id/badge
// Download a pdf badge for an approved appoinment
router.get(
    '/:id/badge',
    protect,
    authorizeRoles('admin', 'security', 'host'),
    downloadBadge
);

module.exports = router;