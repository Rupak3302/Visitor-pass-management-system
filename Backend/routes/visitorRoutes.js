const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');

// Import the visitor controller functions
const { registerVisitor, getAllVisitors, getVisitorById, getOrganizations, getHosts, getAllVisitorsAdmin } = require('../controllers/visitorController');

// Import the authentication middleware
const { protect, authorizeRoles } = require('../middleware/authMiddleware');


// GET /api/hosts
// Public - needed so registration from can show the list of the hosts
router.get(
    '/hosts',
    getHosts
);

// POST /api/visitors - Register a new visitor
// Public - Visitors can pre-registers themselves without needing to login 
router.post(
    '/',
    upload.single('photo'),
    registerVisitor
);

// GET /api/visitors/organizations
// Public - needed for the registration form to populate the organization dropdown
router.get(
    '/organizations',
    getOrganizations
);

// GET /api/visitors/hosts
// Public - needed for the registration form to populate the host dropdown
router.get(
    '/',
    protect,
    authorizeRoles('admin', 'host', 'security'),
    getAllVisitors
);

// GET /api/visitors/:id - Get a single visitor by ID (Protected route)
router.get(
    '/:id',
    protect,
    authorizeRoles('admin', 'host', 'security'),
    getVisitorById
);

// For Admin panel: 
// GET /api/visitors/admin/all - Get all visitors with optional filters (Protected route)
router.get(
    '/admin/all',
    protect,
    authorizeRoles('admin'),
    getAllVisitorsAdmin
);

module.exports = router;