const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const app = express();


// ==============================
// Middleware & Static Files
// ==============================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));


// ==============================
// Session
// ==============================

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax'
    }
}));


// ==============================
// MongoDB Connection
// ==============================

const MONGO_URI =
    process.env.MONGO_URI ||
    'mongodb://localhost:27017/socialNetworkDB';

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log('Successfully connected to MongoDB');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });


// ==============================
// Routes
// ==============================

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const groupRoutes = require('./routes/groupRoutes');
const postRoutes = require('./routes/postRoutes');
const apiRoutes = require('./routes/apiRoutes');

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/groups', groupRoutes);
app.use('/posts', postRoutes);
app.use('/api', apiRoutes);


// ==============================
// Main Page
// ==============================

app.get('/', (req, res) => {
    res.redirect('/trips.html');
});


// ==============================
// Start Server
// ==============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(
        `Server is running at http://localhost:${PORT}/trips.html`
    );
});