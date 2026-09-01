const express = require('express');

const router = express.Router();

const postController = require('../controllers/postController');
const { requireAuth } = require('../middleware/authMiddleware');


// ==============================
// SEARCHES
// ==============================

// חיפוש מתקדם - דרישה 23
router.get(
    '/search/advanced',
    postController.advancedSearchPosts
);

// חיפוש נוסף - דרישה 23
router.get(
    '/search/filter',
    postController.filterPosts
);


// ==============================
// GROUP BY
// ==============================

router.get(
    '/stats/type',
    postController.getPostsStatsByType
);

router.get(
    '/stats/date',
    postController.getPostsStatsByDate
);


// ==============================
// X / Twitter API
// ==============================

router.post(
    '/share-x',
    postController.shareToX
);


// ==============================
// CRUD
// ==============================

// CREATE - רק משתמש מחובר
router.post(
    '/',
    requireAuth,
    postController.createPost
);

// READ ALL
router.get(
    '/',
    postController.getPosts
);

// READ BY ID
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