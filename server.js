const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

// ייבוא ה-Routes של הפוסטים
const postRoutes = require('./routes/postRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// הגדרת תיקייה סטטית לקבצי ה-Frontend
app.use(express.static(path.join(__dirname, 'public')));

// חיבור ל-MongoDB Atlas 
const MONGO_URI = 'mongodb+srv://lihiaz22_db_user:8FkL3mBUdVziTWDq@finaltaskc.xcphidn.mongodb.net/?appName=FinalTask';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// נתיב בדיקה התחלתי
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is up and running!' });
});

// חיבור נתיבי הפוסטים למערכת (Prefix: /posts)
app.use('/posts', postRoutes);

// הפעלת השרת
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});