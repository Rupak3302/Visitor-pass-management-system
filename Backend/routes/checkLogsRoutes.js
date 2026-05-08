const express = require('express');
const router = express.Router();

const {
    scanPass,
    getAllLogs
} = require('../controllers/checkLogsController');

const {
    protect,
    authorizeRoles
} = require('../middleware/authMiddleware');


// only security and admin can access these routes
router.post(
    '/scan',
    protect,
    authorizeRoles('security', 'admin'),
    scanPass
);

// Only admin can view all cheklogs
router.get(
    '/',
    protect,
    authorizeRoles('admin', 'security'),
    getAllLogs
);

module.exports = router;