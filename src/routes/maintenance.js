const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
const { verifyToken } = require('../middleware/auth');

router.post('/startup', verifyToken, maintenanceController.startup);
router.post('/shutdown', verifyToken, maintenanceController.shutdown);
router.post('/issue', verifyToken, maintenanceController.reportIssue);
router.get('/logs', verifyToken, maintenanceController.getLogs);

module.exports = router;
