const express = require('express');
const router = express.Router();
const { getAdminDashboardStats } = require('../controllers/dashboardController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/admin', protect, authorizeRoles('admin'), getAdminDashboardStats);

module.exports = router;