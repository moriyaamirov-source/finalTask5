const Post = require('../models/Post');

// שליפת התפלגות פוסטים לפי אזור בארץ עבור גרף עמודות D3
exports.getCategoryStats = async (req, res) => {
    try {
        let stats = await Post.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $project: { category: "$_id", count: 1, _id: 0 } }
        ]);

        // אם בסיס הנתונים עדיין ריק - מחזירים ברירת מחדל לפי האזורים המדויקים באתר (צפון, מרכז, דרום)
        if (!stats || stats.length === 0) {
            stats = [
                { category: 'צפון', count: 14 },
                { category: 'מרכז', count: 13 },
                { category: 'דרום', count: 13 }
            ];
        }

        res.json(stats);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// שליפת נתונים חודשיים עבור גרף עוגה D3
exports.getMonthlyStats = async (req, res) => {
    try {
        let stats = await Post.aggregate([
            { $group: { _id: { $month: "$createdAt" }, totalPosts: { $sum: 1 } } },
            { $sort: { "_id": 1 } }
        ]);

        // אם בסיס הנתונים עדיין ריק - מחזירים נתונים חודשיים זמניים
        if (!stats || stats.length === 0) {
            stats = [
                { _id: 5, totalPosts: 8 },
                { _id: 6, totalPosts: 12 },
                { _id: 7, totalPosts: 15 },
                { _id: 8, totalPosts: 5 }
            ];
        }

        res.json(stats);
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};