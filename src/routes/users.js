const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middleware/auth');

router.get('/', verifyToken, isAdmin, userController.getUsers);
router.delete('/:id', verifyToken, isAdmin, userController.deleteUser);
router.put('/profile', verifyToken, userController.updateProfile);
router.put('/password', verifyToken, userController.updatePassword);

module.exports = router;
