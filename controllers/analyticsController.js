const Post = require('../models/Post');

// שליפת התפלגות פוסטים לפי קטגוריות עבור גרף עמודות D3
exports.getCategoryStats = async (req, res) => {
    try {
        const stats = await Post.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $project: { category: "$_id", count: 1, _id: 0 } }
        ]);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// שליפת נתונים חודשיים עבור גרף עוגה D3
exports.getMonthlyStats = async (req, res) => {
    try {
        const stats = await Post.aggregate([
            { $group: { _id: { $month: "$createdAt" }, totalPosts: { $sum: 1 } } },
            { $sort: { "_id": 1 } }
        ]);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};