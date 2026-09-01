const express = require('express');

const router = express.Router();

const groupController = require('../controllers/groupController');

const { requireAuth } = require('../middleware/authMiddleware');

const groupPostController = require('../controllers/groupPostController');

// ========================================
// CREATE
// חייב להיות מחובר
// ========================================
router.post(
    '/',
    requireAuth,
    groupController.createGroup
);


// ========================================
// READ ALL
// פתוח גם בלי Login
// ========================================
router.get(
    '/',
    groupController.getGroups
);


// ========================================
// JOIN GROUP
// חייב להיות מחובר
// ========================================
router.post(
    '/:id/join',
    requireAuth,
    groupController.joinGroup
);


// ========================================
// LEAVE GROUP
// חייב להיות מחובר
// ========================================
router.post(
    '/:id/leave',
    requireAuth,
    groupController.leaveGroup
);


// ========================================
// READ BY ID
// פתוח גם בלי Login
// ========================================

router.post(
    '/:id/posts',
    requireAuth,
    groupPostController.createGroupPost
);

router.get(
    '/:id/posts',
    requireAuth,
    groupPostController.getGroupPosts
);


router.get(
    '/:id',
    groupController.getGroupById
);


// ========================================
// UPDATE
// חייב Login
// ה-controller גם בודק שזה ה-admin
// ========================================
router.put(
    '/:id',
    requireAuth,
    groupController.updateGroup
);


// ========================================
// DELETE
// חייב Login
// ה-controller גם בודק שזה ה-admin
// ========================================
router.delete(
    '/:id',
    requireAuth,
    groupController.deleteGroup
);


module.exports = router;