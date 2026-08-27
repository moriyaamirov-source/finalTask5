const Post = require('../models/Post');

// 1. יצירת פוסט חדש (Create)
exports.createPost = async (req, res) => {
    try {
        const { title, content, postType, mediaUrl } = req.body;
        const newPost = new Post({
            title,
            content,
            postType: postType || 'text',
            mediaUrl
        });
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// 2. קבלת כל הפוסטים / חיפוש לפי קטגוריות (List & Search)
exports.getPosts = async (req, res) => {
    try {
        const { search, postType } = req.query;
        let query = {};

        // אם יש חיפוש טקסטואלי
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } }
            ];
        }

        // אם יש סינון לפי סוג פוסט
        if (postType) {
            query.postType = postType;
        }

        const posts = await Post.find(query).sort({ createdAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// 3. עדכון פוסט קיים (Update)
exports.updatePost = async (req, res) => {
    try {
        const { title, content, postType, mediaUrl } = req.body;
        const updatedPost = await Post.findByIdAndUpdate(
            req.params.id,
            { title, content, postType, mediaUrl },
            { new: true, runValidators: true }
        );
        if (!updatedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json(updatedPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// 4. מחיקת פוסט (Delete)
exports.deletePost = async (req, res) => {
    try {
        const deletedPost = await Post.findByIdAndDelete(req.params.id);
        if (!deletedPost) {
            return res.status(404).json({ message: 'Post not found' });
        }
        res.json({ message: 'Post deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};