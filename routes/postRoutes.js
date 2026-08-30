const express = require('express');
const router = express.Router();

const postController = require('../controllers/postController');


// Advanced search
router.get(
    '/search/advanced',
    postController.advancedSearchPosts
);


// GroupBy / Statistics
router.get(
    '/stats/type',
    postController.getPostsStatsByType
);

router.get(
    '/stats/date',
    postController.getPostsStatsByDate
);


// CRUD

// CREATE
router.post(
    '/',
    postController.createPost
);

// READ - all
router.get(
    '/',
    postController.getPosts
);

// READ - by ID
router.get(
    '/:id',
    postController.getPostById
);

// UPDATE
router.put(
    '/:id',
    postController.updatePost
);

// DELETE
router.delete(
    '/:id',
    postController.deletePost
);


module.exports = router;