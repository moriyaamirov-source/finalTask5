const Post = require('../models/Post');

// 1. יצירת פוסט חדש (כולל שיוך ליוצר)
exports.createPost = async (req, res) => {
    try {
        const { title, content, postType, mediaUrl, authorId, location } = req.body;
        const newPost = new Post({
            title,
            content,
            postType: postType || 'text',
            mediaUrl,
            author: authorId, // שיוך למשתמש שיצר את הפוסט
            location
        });
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// 2. קבלת כל הפוסטים (עם חיפוש בסיסי)
exports.getPosts = async (req, res) => {
    try {
        const posts = await Post.find().populate('author', 'username').sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 3. חיפוש מתקדם עם לפחות 3 פרמטרים (דרישה 23)
// פרמטרים לדוגמה: keyword (מילת מפתח), postType (סוג פוסט), startDate (מתאריך מסוים)
exports.advancedSearchPosts = async (req, res) => {
    try {
        const { keyword, postType, startDate } = req.query;
        let query = {};

        // פרמטר 1: מילת מפתח בכותרת או בתוכן
        if (keyword) {
            query.$or = [
                { title: { $regex: keyword, $options: 'i' } },
                { content: { $regex: keyword, $options: 'i' } }
            ];
        }

        // פרמטר 2: סינון לפי סוג פוסט (text, image, video)
        if (postType) {
            query.postType = postType;
        }

        // פרמטר 3: סינון מתאריך מסוים ואילך
        if (startDate) {
            query.createdAt = { $gte: new Date(startDate) };
        }

        const posts = await Post.find(query).populate('author', 'username');
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 4. שאילתות GroupBy / Aggregation (דרישה 24)
// מחזיר סטטיסטיקה של כמות הפעמים שכל סוג פוסט (postType) מופיע במערכת
exports.getPostsStatsByType = async (req, res) => {
    try {
        const stats = await Post.aggregate([
            {
                $group: {
                    _id: "$postType", // קיבוץ לפי סוג הפוסט
                    count: { $sum: 1 }, // ספירת כמות הפוסטים בכל קבוצה
                    averageTitleLength: { $avg: { $strLenCP: "$title" } } // מדד נוסף
                }
            }
        ]);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// שאילתת GroupBy נוספת: קיבוץ פוסטים לפי תאריך יצירה (שנה-חודש-יום)
exports.getPostsStatsByDate = async (req, res) => {
    try {
        const stats = await Post.aggregate([
            {
                $group: {
                    _id: { 
                        year: { $year: "$createdAt" }, 
                        month: { $month: "$createdAt" }, 
                        day: { $dayOfMonth: "$createdAt" } 
                    },
                    totalPosts: { $sum: 1 }
                }
            },
            { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } }
        ]);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 5. עדכון פוסט קיים עם אכיפת הרשאות (דרישה 25)
exports.updatePost = async (req, res) => {
    try {
        const { title, content, postType, mediaUrl, userId, location } = req.body;
        
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // אכיפת הרשאות: בדיקה האם המשתמש המבקש הוא אכן יוצר הפוסט
        if (post.author && post.author.toString() !== userId) {
            return res.status(403).json({ message: 'Permission denied: You can only edit your own posts' });
        }

        post.title = title || post.title;
        post.content = content || post.content;
        post.postType = postType || post.postType;
        post.mediaUrl = mediaUrl || post.mediaUrl;
        if (location) post.location = location;

        const updatedPost = await post.save();
        res.json(updatedPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// 6. מחיקת פוסט עם אכיפת הרשאות (דרישה 25)[cite: 1]
exports.deletePost = async (req, res) => {
    try {
        const { userId } = req.body; // או מתוך ה-Session/Token
        const post = await Post.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // אכיפת הרשאות: רק יוצר הפוסט יכול למחוק אותו
        if (post.author && post.author.toString() !== userId) {
            return res.status(403).json({ message: 'Permission denied: You can only delete your own posts' });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};