const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, isAdmin, reportController.getReports);
router.post('/generate', verifyToken, isAdmin, reportController.generateReport);
router.delete('/:fileName', verifyToken, isAdmin, reportController.deleteReport);

module.exports = router;
