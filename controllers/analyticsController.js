const Post = require('../models/Post');


// ========================================
// גרף 1 - כמות מסלולים לפי אזור
// הנתונים מגיעים ישירות מ-MongoDB
// ========================================

exports.getCategoryStats = async (req, res) => {
    try {
        const stats = await Post.aggregate([
            {
                // רק Posts שהם מסלולים ויש להם אזור תקין
                $match: {
                    region: {
                        $in: ['צפון', 'מרכז', 'דרום']
                    }
                }
            },
            {
                $group: {
                    _id: '$region',
                    count: {
                        $sum: 1
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    category: '$_id',
                    count: 1
                }
            },
            {
                $sort: {
                    category: 1
                }
            }
        ]);

        res.status(200).json(stats);

    } catch (error) {
        console.error(
            'Analytics category error:',
            error
        );

        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};


// ========================================
// גרף 2 - כמות Posts לפי חודש
// הנתונים מגיעים ישירות מ-MongoDB
// ========================================

exports.getMonthlyStats = async (req, res) => {
    try {
        const stats = await Post.aggregate([
            {
                $group: {
                    _id: {
                        $month: '$createdAt'
                    },
                    totalPosts: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    _id: 1
                }
            }
        ]);

        res.status(200).json(stats);

    } catch (error) {
        console.error(
            'Analytics monthly error:',
            error
        );

        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};