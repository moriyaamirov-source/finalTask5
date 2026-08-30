const express = require('express');

const router = express.Router();

const postController = require('../controllers/postController');


// חיפוש מתקדם - דרישה 23
router.get('/search/advanced', postController.advancedSearchPosts);


// GroupBy - דרישה 24
router.get('/stats/type', postController.getPostsStatsByType);

router.get('/stats/date', postController.getPostsStatsByDate);


// נתיבי CRUD
router.post('/', postController.createPost);

router.get('/', postController.getPosts);

router.put('/:id', postController.updatePost);

router.delete('/:id', postController.deletePost);


// פרסום פוסט ל-X באמצעות X API
router.post('/share-x', postController.shareToX);


module.exports = router;