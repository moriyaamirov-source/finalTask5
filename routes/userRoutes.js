const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');

// CREATE
router.post('/', userController.createUser);

// READ - all
router.get('/', userController.getAllUsers);

// READ - by ID
router.get('/:id', userController.getUserById);

// UPDATE
router.put('/:id', userController.updateUser);

// DELETE
router.delete('/:id', userController.deleteUser);

module.exports = router;