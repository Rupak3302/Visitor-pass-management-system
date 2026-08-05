const express = require('express');
const router = express.Router();

const { 
    inviteVisitor,
    getAppointments,
    getAppointmentById, 
    updateAppointmentStatus,
    getAllAppointmentsAdmin,
    getAllPassesAdmin
    // downloadBadge
} = require('../controllers/appoinmentController');

const { 
    protect, 
    authorizeRoles 
} = require('../middleware/authMiddleware');



// Route: POST /api/appointments/invite
// Only Admin and Host can create invites
router.post(
    '/invite',
    protect,
    authorizeRoles('admin', 'host'),
    inviteVisitor
);

// Route: GET /api/appointments
// Everyone logged in can view own appointments, admin can view all
router.get(
    '/',
    protect,
    authorizeRoles('admin', 'host'),
    getAppointments
);


// Only Admin can view all appointments
// GET /api/appointments/admin/all
router.get(
    '/admin/all',
    protect,
    authorizeRoles('admin'),
    getAllAppointmentsAdmin
);

router.get(
    '/passes/all',
    protect,
    authorizeRoles('admin'),
    getAllPassesAdmin
);

// Route: GET /api/appointments/:id
router.get(
    '/:id',
    protect,
    authorizeRoles('admin', 'host'),
    getAppointmentById
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
// router.get(
//     '/:id/badge',
//     protect,
//     authorizeRoles('admin', 'host'),
//     downloadBadge
// );


module.exports = router;







// getMyAppointments,

// Route: GET /api/appointments
// Everyone logged in can view, but the controller filters based on role
// router.get(
//     '/',
//     protect,
//     authorizeRoles('admin', 'host'),
//     getMyAppointments
// );