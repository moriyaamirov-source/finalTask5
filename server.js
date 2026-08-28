// server.js
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();

// הגדרת תוכנות ביניים (Middleware) והגשת קבצים סטטיים
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));

// הגדרת נתוני הפעלה (Session Configuration)
app.use(session({
    secret: 'mySuperSecretKey123',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // לשימוש מקומי משאירים false
}));

// התחברות למסד הנתונים MongoDB באמצעות משתנה סביבה מתוך .env
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/socialNetworkDB';

mongoose.connect(MONGO_URI)
.then(() => console.log('מחובר בהצלחה ל-MongoDB'))
.catch(err => console.error('שגיאה בהתחברות ל-MongoDB:', err));

// הגדרת נתיבים (Routes)
const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const postRoutes = require('./routes/postRoutes');
const apiRoutes = require('./routes/apiRoutes');

app.use('/auth', authRoutes);
app.use('/groups', groupRoutes);
app.use('/posts', postRoutes);
app.use('/api', apiRoutes);

// הפעלת השרת על הפורט המוגדר
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`השרת רץ בהצלחה על פורט ${PORT}`);
});