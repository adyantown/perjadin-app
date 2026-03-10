const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAllUsers);
router.post('/save', userController.createUser);
router.put('/reset-password/:id', userController.resetPassword);
router.delete('/delete/:id', userController.deleteUser);

module.exports = router;
