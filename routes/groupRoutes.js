const express = require('express');
const router = express.Router();

const groupController = require('../controllers/groupController');

// CREATE
router.post('/', groupController.createGroup);

// READ - all
router.get('/', groupController.getAllGroups);

// READ - by ID
router.get('/:id', groupController.getGroupById);

// UPDATE
router.put('/:id', groupController.updateGroup);

// DELETE
router.delete('/:id', groupController.deleteGroup);

module.exports = router;