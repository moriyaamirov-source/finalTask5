const express = require('express');

const router = express.Router();

const userController = require('../controllers/userController');
const feedController = require('../controllers/feedController');

const { requireAuth } = require('../middleware/authMiddleware');


// ==============================
// FRIENDS
// ==============================

router.get(
    '/friends/me',
    requireAuth,
    userController.getMyFriends
);

router.post(
    '/friends/:friendId',
    requireAuth,
    userController.addFriend
);

router.delete(
    '/friends/:friendId',
    requireAuth,
    userController.removeFriend
);


// ==============================
// MY POSTS + FEED
// חשוב: לפני /:id
// ==============================

router.get(
    '/posts/me',
    requireAuth,
    feedController.getMyPosts
);

router.get(
    '/feed/me',
    requireAuth,
    feedController.getFeed
);


// ==============================
// CREATE
// ==============================

router.post(
    '/',
    userController.createUser
);


// ==============================
// READ ALL
// ==============================

router.get(
    '/',
    userController.getAllUsers
);


// ==============================
// READ BY ID
// ==============================

router.get(
    '/:id',
    userController.getUserById
);


// ==============================
// UPDATE OWN USER
// ==============================

router.put(
    '/:id',
    requireAuth,
    userController.updateUser
);


// ==============================
// DELETE OWN USER
// ==============================

router.delete(
    '/:id',
    requireAuth,
    userController.deleteUser
);


module.exports = router;