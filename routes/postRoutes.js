const express = require('express');
const router = express.Router();

const postController = require('../controllers/postController');
const { requireAuth } = require('../middleware/authMiddleware');


// SEARCHES
router.get(
    '/search/advanced',
    postController.advancedSearchPosts
);

router.get(
    '/search/filter',
    postController.filterPosts
);


// GROUP BY
router.get(
    '/stats/type',
    postController.getPostsStatsByType
);

router.get(
    '/stats/date',
    postController.getPostsStatsByDate
);


// CRUD

// CREATE - רק משתמש מחובר
router.post(
    '/',
    requireAuth,
    postController.createPost
);

// READ - אפשר לקרוא בלי Login
router.get(
    '/',
    postController.getPosts
);

router.get(
    '/:id',
    postController.getPostById
);

// UPDATE - רק משתמש מחובר
router.put(
    '/:id',
    requireAuth,
    postController.updatePost
);

// DELETE - רק משתמש מחובר
router.delete(
    '/:id',
    requireAuth,
    postController.deletePost
);


module.exports = router;