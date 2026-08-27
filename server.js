const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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

// הפעלת השרת
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});