const express = require('express');
const router = express.Router();
const { getMasterReport } = require('../controllers/reportController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

router.get('/master', protect, authorizeRoles('admin'), getMasterReport);

module.exports = router;