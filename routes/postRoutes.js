const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');

router.get('/search/advanced', postController.advancedSearchPosts); // דרישה 23[cite: 1]
router.get('/stats/type', postController.getPostsStatsByType);       // דרישה 24 (GroupBy 1)[cite: 1]
router.get('/stats/date', postController.getPostsStatsByDate);       // דרישה 24 (GroupBy 2)[cite: 1]

// נתיבי CRUD רגילים
router.post('/', postController.createPost);
router.get('/', postController.getPosts);
router.put('/:id', postController.updatePost);       // כולל אכיפת הרשאות (דרישה 25)[cite: 1]
router.delete('/:id', postController.deletePost);   // כולל אכיפת הרשאות (דרישה 25)[cite: 1]

module.exports = router;