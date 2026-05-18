const express = require('express');
const router = express.Router();

const {
    scanPass,
    // getAllLogs
    getTodayLogs
} = require('../controllers/checkLogsController');

const {
    protect,
    authorizeRoles
} = require('../middleware/authMiddleware');


// only security and admin can access these routes
router.post(
    '/scan',
    protect,
    authorizeRoles('security'),
    scanPass
);

// Only admin can view all cheklogs
router.get(
    '/today',
    protect,
    // authorizeRoles('security'),
    getTodayLogs
);

module.exports = router;