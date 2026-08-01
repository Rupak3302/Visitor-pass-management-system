const express = require('express');
const router = express.Router();

const {
    scanPass,
    getTodayLogs,
    getAllLogsAdmin
} = require('../controllers/checkLogsController');

const {
    protect,
    authorizeRoles
} = require('../middleware/authMiddleware');


// only security can access these routes
router.post(
    '/scan',
    protect,
    authorizeRoles('security'),
    scanPass
);

// Only security and admin can view all cheklogs
router.get(
    '/today',
    protect,
    // authorizeRoles('security'),
    getTodayLogs
);

// Only Admin can view all cheklogs
router.get(
    '/admin/all',
    protect,
    authorizeRoles('admin'),
    getAllLogsAdmin
)

module.exports = router;