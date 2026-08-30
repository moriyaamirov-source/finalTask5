const Post = require('../models/Post');
const mongoose = require('mongoose');


// CREATE - יצירת פוסט חדש
exports.createPost = async (req, res) => {
    try {
        const { title, content, postType, mediaUrl, authorId } = req.body;

        // בדיקת שדות חובה
        if (!title || !content) {
            return res.status(400).json({
                message: 'Title and content are required'
            });
        }

        // אם התקבל authorId - נבדוק שהוא ID תקין
        if (authorId && !mongoose.Types.ObjectId.isValid(authorId)) {
            return res.status(400).json({
                message: 'Invalid author ID'
            });
        }

        const newPost = new Post({
            title,
            content,
            postType: postType || 'text',
            mediaUrl,
            author: authorId
        });

        const savedPost = await newPost.save();

        res.status(201).json(savedPost);

    } catch (err) {
        console.error('Error creating post:', err);

        res.status(400).json({
            message: err.message
        });
    }
};


// READ - שליפת כל הפוסטים
exports.getPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'username')
            .sort({ createdAt: -1 });

        res.status(200).json(posts);

    } catch (err) {
        console.error('Error fetching posts:', err);

        res.status(500).json({
            message: 'Failed to fetch posts'
        });
    }
};


// READ - שליפת פוסט לפי ID
exports.getPostById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        const post = await Post.findById(req.params.id)
            .populate('author', 'username');

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        res.status(200).json(post);

    } catch (err) {
        console.error('Error fetching post:', err);

        res.status(500).json({
            message: 'Failed to fetch post'
        });
    }
};


// SEARCH - חיפוש מתקדם
// החלק הזה יוכל להישאר אצל יפתח / להשתנות על ידו בהמשך
exports.advancedSearchPosts = async (req, res) => {
    try {
        const { keyword, postType, startDate } = req.query;

        const query = {};

        // פרמטר 1 - מילת מפתח
        if (keyword) {
            query.$or = [
                {
                    title: {
                        $regex: keyword,
                        $options: 'i'
                    }
                },
                {
                    content: {
                        $regex: keyword,
                        $options: 'i'
                    }
                }
            ];
        }

        // פרמטר 2 - סוג פוסט
        if (postType) {
            query.postType = postType;
        }

        // פרמטר 3 - תאריך
        if (startDate) {
            query.createdAt = {
                $gte: new Date(startDate)
            };
        }

        const posts = await Post.find(query)
            .populate('author', 'username');

        res.status(200).json(posts);

    } catch (err) {
        console.error('Error searching posts:', err);

        res.status(500).json({
            message: err.message
        });
    }
};


// GROUP BY 1 - סטטיסטיקה לפי סוג פוסט
exports.getPostsStatsByType = async (req, res) => {
    try {
        const stats = await Post.aggregate([
            {
                $group: {
                    _id: '$postType',
                    count: { $sum: 1 },
                    averageTitleLength: {
                        $avg: {
                            $strLenCP: '$title'
                        }
                    }
                }
            }
        ]);

        res.status(200).json(stats);

    } catch (err) {
        console.error('Error fetching post type stats:', err);

        res.status(500).json({
            message: err.message
        });
    }
};


// GROUP BY 2 - סטטיסטיקה לפי תאריך
exports.getPostsStatsByDate = async (req, res) => {
    try {
        const stats = await Post.aggregate([
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    totalPosts: { $sum: 1 }
                }
            },
            {
                $sort: {
                    '_id.year': -1,
                    '_id.month': -1,
                    '_id.day': -1
                }
            }
        ]);

        res.status(200).json(stats);

    } catch (err) {
        console.error('Error fetching post date stats:', err);

        res.status(500).json({
            message: err.message
        });
    }
};


// UPDATE - עדכון פוסט
exports.updatePost = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        const {
            title,
            content,
            postType,
            mediaUrl,
            userId
        } = req.body;

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        // בדיקת הרשאה זמנית.
        // יפתח יוכל בהמשך להחליף אותה ב-Session/Authentication.
        if (
            post.author &&
            post.author.toString() !== userId
        ) {
            return res.status(403).json({
                message: 'Permission denied: You can only edit your own posts'
            });
        }

        if (title !== undefined) {
            post.title = title;
        }

        if (content !== undefined) {
            post.content = content;
        }

        if (postType !== undefined) {
            post.postType = postType;
        }

        if (mediaUrl !== undefined) {
            post.mediaUrl = mediaUrl;
        }

        const updatedPost = await post.save();

        res.status(200).json(updatedPost);

    } catch (err) {
        console.error('Error updating post:', err);

        res.status(400).json({
            message: err.message
        });
    }
};


// DELETE - מחיקת פוסט
exports.deletePost = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        const { userId } = req.body;

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        // בדיקת הרשאה זמנית.
        // יפתח יוכל להחליף אותה ב-Session/Authentication.
        if (
            post.author &&
            post.author.toString() !== userId
        ) {
            return res.status(403).json({
                message: 'Permission denied: You can only delete your own posts'
            });
        }

        await Post.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: 'Post deleted successfully'
        });

    } catch (err) {
        console.error('Error deleting post:', err);

        res.status(500).json({
            message: err.message
        });
    }
};