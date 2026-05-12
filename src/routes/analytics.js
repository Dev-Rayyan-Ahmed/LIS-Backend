const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/stats', verifyToken, isAdmin, analyticsController.getDashboardStats);
router.get('/audit', verifyToken, isAdmin, analyticsController.getSystemAuditLogs);

module.exports = router;
