const Post = require('../models/Post');
const mongoose = require('mongoose');


// CREATE
exports.createPost = async (req, res) => {
    try {
        const {
            title,
            content,
            postType,
            mediaUrl
        } = req.body;

        if (!title || !content) {
            return res.status(400).json({
                message: 'Title and content are required'
            });
        }

        const newPost = new Post({
            title,
            content,
            postType: postType || 'text',
            mediaUrl,

            // היוצר מגיע מה-session בלבד
            author: req.session.userId
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


// READ ALL
exports.getPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .populate('author', 'username')
            .sort({ createdAt: -1 });

        res.status(200).json(posts);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};


// READ BY ID
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
        res.status(500).json({
            message: err.message
        });
    }
};


// ========================================
// SEARCH 1 - לפחות 3 פרמטרים
// keyword + postType + startDate
// ========================================
exports.advancedSearchPosts = async (req, res) => {
    try {
        const {
            keyword,
            postType,
            startDate
        } = req.query;

        const query = {};

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

        if (postType) {
            query.postType = postType;
        }

        if (startDate) {
            const parsedDate = new Date(startDate);

            if (Number.isNaN(parsedDate.getTime())) {
                return res.status(400).json({
                    message: 'Invalid startDate'
                });
            }

            query.createdAt = {
                $gte: parsedDate
            };
        }

        const posts = await Post.find(query)
            .populate('author', 'username')
            .sort({ createdAt: -1 });

        res.status(200).json(posts);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};


// ========================================
// SEARCH 2 - לפחות 3 פרמטרים
// title + endDate + hasMedia
// ========================================
exports.filterPosts = async (req, res) => {
    try {
        const {
            title,
            endDate,
            hasMedia
        } = req.query;

        const query = {};

        if (title) {
            query.title = {
                $regex: title,
                $options: 'i'
            };
        }

        if (endDate) {
            const parsedDate = new Date(endDate);

            if (Number.isNaN(parsedDate.getTime())) {
                return res.status(400).json({
                    message: 'Invalid endDate'
                });
            }

            query.createdAt = {
                $lte: parsedDate
            };
        }

        if (hasMedia === 'true') {
            query.mediaUrl = {
                $exists: true,
                $nin: [null, '']
            };
        }

        if (hasMedia === 'false') {
            query.$or = [
                { mediaUrl: { $exists: false } },
                { mediaUrl: null },
                { mediaUrl: '' }
            ];
        }

        const posts = await Post.find(query)
            .populate('author', 'username')
            .sort({ createdAt: -1 });

        res.status(200).json(posts);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};


// ========================================
// GROUP BY 1
// קיבוץ לפי סוג פוסט
// ========================================
exports.getPostsStatsByType = async (req, res) => {
    try {
        const stats = await Post.aggregate([
            {
                $group: {
                    _id: '$postType',
                    count: {
                        $sum: 1
                    },
                    averageTitleLength: {
                        $avg: {
                            $strLenCP: '$title'
                        }
                    }
                }
            },
            {
                $sort: {
                    count: -1
                }
            }
        ]);

        res.status(200).json(stats);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};


// ========================================
// GROUP BY 2
// קיבוץ לפי תאריך
// ========================================
exports.getPostsStatsByDate = async (req, res) => {
    try {
        const stats = await Post.aggregate([
            {
                $group: {
                    _id: {
                        year: {
                            $year: '$createdAt'
                        },
                        month: {
                            $month: '$createdAt'
                        },
                        day: {
                            $dayOfMonth: '$createdAt'
                        }
                    },
                    totalPosts: {
                        $sum: 1
                    }
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
        res.status(500).json({
            message: err.message
        });
    }
};


// UPDATE
exports.updatePost = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        // הרשאה לפי session
        if (
            !post.author ||
            post.author.toString() !== req.session.userId
        ) {
            return res.status(403).json({
                message: 'Permission denied: You can only edit your own posts'
            });
        }

        const {
            title,
            content,
            postType,
            mediaUrl
        } = req.body;

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
        res.status(400).json({
            message: err.message
        });
    }
};


// DELETE
exports.deletePost = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        if (
            !post.author ||
            post.author.toString() !== req.session.userId
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
        res.status(500).json({
            message: err.message
        });
    }
};