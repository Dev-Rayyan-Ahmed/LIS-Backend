const express = require('express');
const router = express.Router();
const machineController = require('../controllers/machineController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, machineController.getMachines);
router.post('/', verifyToken, isAdmin, machineController.createMachine);
router.put('/:id', verifyToken, isAdmin, machineController.updateMachine);
router.delete('/:id', verifyToken, isAdmin, machineController.deleteMachine);

module.exports = router;
