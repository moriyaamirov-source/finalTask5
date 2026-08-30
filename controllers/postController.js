const Post = require('../models/Post');
const { TwitterApi } = require('twitter-api-v2');

// 1. יצירת פוסט חדש
exports.createPost = async (req, res) => {
    try {
        const { title, content, postType, mediaUrl, authorId } = req.body;

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
        res.status(400).json({
            message: err.message
        });
    }
};


// 2. קבלת כל הפוסטים
exports.getPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'username')
            .sort({ createdAt: -1 });

        res.json(posts);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};


// 3. חיפוש מתקדם עם 3 פרמטרים
exports.advancedSearchPosts = async (req, res) => {
    try {
        const { keyword, postType, startDate } = req.query;

        let query = {};

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

        res.json(posts);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};


// 4. GroupBy לפי סוג פוסט
exports.getPostsStatsByType = async (req, res) => {
    try {
        const stats = await Post.aggregate([
            {
                $group: {
                    _id: "$postType",
                    count: {
                        $sum: 1
                    },
                    averageTitleLength: {
                        $avg: {
                            $strLenCP: "$title"
                        }
                    }
                }
            }
        ]);

        res.json(stats);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};


// GroupBy נוסף לפי תאריך יצירה
exports.getPostsStatsByDate = async (req, res) => {
    try {
        const stats = await Post.aggregate([
            {
                $group: {
                    _id: {
                        year: {
                            $year: "$createdAt"
                        },
                        month: {
                            $month: "$createdAt"
                        },
                        day: {
                            $dayOfMonth: "$createdAt"
                        }
                    },
                    totalPosts: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    "_id.year": -1,
                    "_id.month": -1,
                    "_id.day": -1
                }
            }
        ]);

        res.json(stats);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};


// 5. עדכון פוסט
exports.updatePost = async (req, res) => {
    try {
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

        // רק יוצר הפוסט יכול לערוך אותו
        if (
            post.author &&
            post.author.toString() !== userId
        ) {
            return res.status(403).json({
                message: 'Permission denied: You can only edit your own posts'
            });
        }

        post.title = title || post.title;
        post.content = content || post.content;
        post.postType = postType || post.postType;
        post.mediaUrl = mediaUrl || post.mediaUrl;

        const updatedPost = await post.save();

        res.json(updatedPost);

    } catch (err) {
        res.status(400).json({
            message: err.message
        });
    }
};


// 6. מחיקת פוסט
exports.deletePost = async (req, res) => {
    try {
        const { userId } = req.body;

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        // רק יוצר הפוסט יכול למחוק אותו
        if (
            post.author &&
            post.author.toString() !== userId
        ) {
            return res.status(403).json({
                message: 'Permission denied: You can only delete your own posts'
            });
        }

        await Post.findByIdAndDelete(req.params.id);

        res.json({
            message: 'Post deleted successfully'
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};


// 7. פרסום אמיתי ל-X באמצעות X API
exports.shareToX = async (req, res) => {
    try {
        const {
            X_API_KEY,
            X_API_SECRET,
            X_ACCESS_TOKEN,
            X_ACCESS_TOKEN_SECRET
        } = process.env;

        if (
            !X_API_KEY ||
            !X_API_SECRET ||
            !X_ACCESS_TOKEN ||
            !X_ACCESS_TOKEN_SECRET
        ) {
            return res.status(500).json({
                success: false,
                message: 'חסרים פרטי התחברות ל-X בשרת'
            });
        }

        const { text } = req.body;

        if (!text || !text.trim()) {
            return res.status(400).json({
                success: false,
                message: 'יש להזין טקסט לפרסום'
            });
        }

        const client = new TwitterApi({
            appKey: X_API_KEY,
            appSecret: X_API_SECRET,
            accessToken: X_ACCESS_TOKEN,
            accessSecret: X_ACCESS_TOKEN_SECRET
        });

        const result = await client.v2.tweet(
            text.trim()
        );

        res.status(200).json({
            success: true,
            message: 'הפוסט פורסם בהצלחה ב-X',
            postId: result.data.id
        });

    } catch (error) {
        console.error(
            'X API error:',
            error
        );

        res.status(500).json({
            success: false,
            message: 'שגיאה בפרסום ל-X'
        });
    }
};