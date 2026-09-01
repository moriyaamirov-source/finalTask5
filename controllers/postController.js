const Post = require('../models/Post');
const mongoose = require('mongoose');
const { TwitterApi } = require('twitter-api-v2');

const VALID_REGIONS = ['צפון', 'מרכז', 'דרום'];
const VALID_DIFFICULTIES = ['קל', 'בינוני', 'קשה'];


// =========================
// עזר - נרמול מיקום
// =========================

function normalizeLocation(location) {
    if (location === undefined) {
        return undefined;
    }

    if (typeof location === 'string') {
        return {
            address: location.trim()
        };
    }

    if (!location || typeof location !== 'object') {
        throw new Error('Invalid location');
    }

    const normalized = {};

    if (location.address !== undefined) {
        normalized.address =
            String(location.address).trim();
    }

    if (
        location.lat !== undefined &&
        location.lat !== null &&
        location.lat !== ''
    ) {
        const lat = Number(location.lat);

        if (
            !Number.isFinite(lat) ||
            lat < -90 ||
            lat > 90
        ) {
            throw new Error('Invalid latitude');
        }

        normalized.lat = lat;
    }

    if (
        location.lng !== undefined &&
        location.lng !== null &&
        location.lng !== ''
    ) {
        const lng = Number(location.lng);

        if (
            !Number.isFinite(lng) ||
            lng < -180 ||
            lng > 180
        ) {
            throw new Error('Invalid longitude');
        }

        normalized.lng = lng;
    }

    return normalized;
}


// =========================
// ולידציה של מסלול
// =========================

function validateTripFields({
    region,
    duration,
    difficulty,
    location
}) {
    const hasLocationData = Boolean(
        location &&
        (
            location.address ||
            location.lat !== undefined ||
            location.lng !== undefined
        )
    );

    const hasTripData =
        region !== undefined ||
        duration !== undefined ||
        difficulty !== undefined ||
        hasLocationData;

    // אם זה Post רגיל ולא מסלול
    if (!hasTripData) {
        return null;
    }

    if (!VALID_REGIONS.includes(region)) {
        return 'Region must be one of: צפון, מרכז, דרום';
    }

    const parsedDuration = Number(duration);

    if (
        !Number.isFinite(parsedDuration) ||
        parsedDuration < 0.5
    ) {
        return 'Duration must be at least 0.5 hours';
    }

    if (
        !VALID_DIFFICULTIES.includes(difficulty)
    ) {
        return 'Difficulty must be one of: קל, בינוני, קשה';
    }

    if (
        !location ||
        !location.address ||
        !String(location.address).trim()
    ) {
        return 'Location address is required for a trip';
    }

    return null;
}


// ========================================
// CREATE
// ========================================

exports.createPost = async (req, res) => {
    try {
        if (
            !req.session ||
            !req.session.userId
        ) {
            return res.status(401).json({
                message: 'Authentication required'
            });
        }

        const {
            title,
            content,
            postType,
            mediaUrl,
            region,
            duration,
            difficulty,
            location
        } = req.body;

        if (
            !title ||
            !String(title).trim() ||
            !content ||
            !String(content).trim()
        ) {
            return res.status(400).json({
                message: 'Title and content are required'
            });
        }

        const normalizedLocation =
            normalizeLocation(location);

        const tripValidationError =
            validateTripFields({
                region,
                duration,
                difficulty,
                location: normalizedLocation
            });

        if (tripValidationError) {
            return res.status(400).json({
                message: tripValidationError
            });
        }

        const newPost = new Post({
            title: String(title).trim(),
            content: String(content).trim(),
            postType: postType || 'text',
            mediaUrl,

            // היוצר נלקח מה-session
            author: req.session.userId,

            region,

            duration:
                duration !== undefined
                    ? Number(duration)
                    : undefined,

            difficulty,

            location: normalizedLocation
        });

        const savedPost =
            await newPost.save();

        res.status(201).json(savedPost);

    } catch (err) {
        console.error(
            'Error creating post:',
            err
        );

        res.status(400).json({
            message: err.message
        });
    }
};


// ========================================
// READ ALL
// ========================================

exports.getPosts = async (req, res) => {
    try {
        const posts =
            await Post.find()
                .populate(
                    'author',
                    'username'
                )
                .sort({
                    createdAt: -1
                });

        res.status(200).json(posts);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};


// ========================================
// READ BY ID
// ========================================

exports.getPostById = async (req, res) => {
    try {
        if (
            !mongoose.Types.ObjectId
                .isValid(req.params.id)
        ) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        const post =
            await Post
                .findById(req.params.id)
                .populate(
                    'author',
                    'username'
                );

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
// SEARCH 1
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
            query.postType =
                postType;
        }

        if (startDate) {
            const parsedDate =
                new Date(startDate);

            if (
                Number.isNaN(
                    parsedDate.getTime()
                )
            ) {
                return res.status(400).json({
                    message: 'Invalid startDate'
                });
            }

            query.createdAt = {
                $gte: parsedDate
            };
        }

        const posts =
            await Post.find(query)
                .populate(
                    'author',
                    'username'
                )
                .sort({
                    createdAt: -1
                });

        res.status(200).json(posts);

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};


// ========================================
// SEARCH 2
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
            const parsedDate =
                new Date(endDate);

            if (
                Number.isNaN(
                    parsedDate.getTime()
                )
            ) {
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
                $nin: [
                    null,
                    ''
                ]
            };
        }

        if (hasMedia === 'false') {
            query.$or = [
                {
                    mediaUrl: {
                        $exists: false
                    }
                },
                {
                    mediaUrl: null
                },
                {
                    mediaUrl: ''
                }
            ];
        }

        const posts =
            await Post.find(query)
                .populate(
                    'author',
                    'username'
                )
                .sort({
                    createdAt: -1
                });

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
        const stats =
            await Post.aggregate([
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
        const stats =
            await Post.aggregate([
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


// ========================================
// UPDATE
// ========================================

exports.updatePost = async (req, res) => {
    try {
        if (
            !req.session ||
            !req.session.userId
        ) {
            return res.status(401).json({
                message: 'Authentication required'
            });
        }

        if (
            !mongoose.Types.ObjectId
                .isValid(req.params.id)
        ) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        const post =
            await Post.findById(
                req.params.id
            );

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        // הרשאה - רק בעל הפוסט
        if (
            !post.author ||
            post.author.toString() !==
                String(req.session.userId)
        ) {
            return res.status(403).json({
                message:
                    'Permission denied: You can only edit your own posts'
            });
        }

        const {
            title,
            content,
            postType,
            mediaUrl,
            region,
            duration,
            difficulty,
            location
        } = req.body;

        if (title !== undefined) {
            if (!String(title).trim()) {
                return res.status(400).json({
                    message: 'Title cannot be empty'
                });
            }

            post.title =
                String(title).trim();
        }

        if (content !== undefined) {
            if (!String(content).trim()) {
                return res.status(400).json({
                    message: 'Content cannot be empty'
                });
            }

            post.content =
                String(content).trim();
        }

        if (postType !== undefined) {
            post.postType =
                postType;
        }

        if (mediaUrl !== undefined) {
            post.mediaUrl =
                mediaUrl;
        }

        if (region !== undefined) {
            post.region =
                region;
        }

        if (duration !== undefined) {
            post.duration =
                Number(duration);
        }

        if (difficulty !== undefined) {
            post.difficulty =
                difficulty;
        }

        if (location !== undefined) {
            post.location =
                normalizeLocation(
                    location
                );
        }

        const currentLocation =
            post.location
                ? {
                    address:
                        post.location.address,

                    lat:
                        post.location.lat,

                    lng:
                        post.location.lng
                }
                : undefined;

        const tripValidationError =
            validateTripFields({
                region: post.region,
                duration: post.duration,
                difficulty: post.difficulty,
                location: currentLocation
            });

        if (tripValidationError) {
            return res.status(400).json({
                message: tripValidationError
            });
        }

        const updatedPost =
            await post.save();

        res.status(200).json(
            updatedPost
        );

    } catch (err) {
        res.status(400).json({
            message: err.message
        });
    }
};


// ========================================
// DELETE
// ========================================

exports.deletePost = async (req, res) => {
    try {
        if (
            !req.session ||
            !req.session.userId
        ) {
            return res.status(401).json({
                message: 'Authentication required'
            });
        }

        if (
            !mongoose.Types.ObjectId
                .isValid(req.params.id)
        ) {
            return res.status(400).json({
                message: 'Invalid post ID'
            });
        }

        const post =
            await Post.findById(
                req.params.id
            );

        if (!post) {
            return res.status(404).json({
                message: 'Post not found'
            });
        }

        // הרשאה - רק בעל הפוסט
        if (
            !post.author ||
            post.author.toString() !==
                String(req.session.userId)
        ) {
            return res.status(403).json({
                message:
                    'Permission denied: You can only delete your own posts'
            });
        }

        await Post.findByIdAndDelete(
            req.params.id
        );

        res.status(200).json({
            message:
                'Post deleted successfully'
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};


// ========================================
// X / TWITTER API - העבודה של נטע
// ========================================

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
                message:
                    'חסרים פרטי התחברות ל-X בשרת'
            });
        }

        const { text } = req.body;

        if (
            !text ||
            !text.trim()
        ) {
            return res.status(400).json({
                success: false,
                message:
                    'יש להזין טקסט לפרסום'
            });
        }

        const client = new TwitterApi({
            appKey: X_API_KEY,
            appSecret: X_API_SECRET,
            accessToken: X_ACCESS_TOKEN,
            accessSecret:
                X_ACCESS_TOKEN_SECRET
        });

        const currentUser =
            await client.currentUserV2();

        console.log(
            'Connected X account:',
            currentUser.data
        );

        const result =
            await client.v2.tweet(
                text.trim()
            );

        console.log(
            'X API response:',
            result
        );

        console.log(
            'Published X post ID:',
            result.data.id
        );

        res.status(200).json({
            success: true,
            message:
                'הפוסט פורסם בהצלחה ב-X',
            postId:
                result.data.id
        });

    } catch (error) {
        console.error(
            'X API error:',
            error
        );

        res.status(500).json({
            success: false,
            message:
                'שגיאה בפרסום ל-X'
        });
    }
};