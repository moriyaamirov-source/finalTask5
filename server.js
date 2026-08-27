const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const Post = require('./models/Post'); // ייבוא של מודל הפוסטים

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware לקריאת JSON וטפסים
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// הגדרת תיקייה סטטית לקבצי ה-Frontend (HTML/CSS/JS צד לקוח)
app.use(express.static(path.join(__dirname, 'public')));

// חיבור ל-MongoDB Atlas 
const MONGO_URI = 'mongodb+srv://lihiaz22_db_user:8FkL3mBUdVziTWDq@finaltaskc.xcphidn.mongodb.net/?appName=FinalTask'
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// נתיב בדיקה התחלתי
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is up and running!' });
});

// ==========================================
// נתיבי ה-API לפוסטים (CRUD)
// ==========================================

// 1. יצירת פוסט חדש (POST)
app.post('/posts', async (req, res) => {
    try {
        const newPost = new Post({
            title: req.body.title,
            content: req.body.content
        });
        const savedPost = await newPost.save();
        res.status(201).json(savedPost);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// 2. קבלת כל הפוסטים (GET)
app.get('/posts', async (req, res) => {
    try {
        const posts = await Post.find();
        res.json(posts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// הפעלת השרת
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});