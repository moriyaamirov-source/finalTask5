const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
require('dotenv').config();

const mapsKey = process.env.GOOGLE_MAPS_API_KEY;

console.log(
    'MAP KEY CHECK:',
    mapsKey
        ? `${mapsKey.substring(0, 4)}...${mapsKey.substring(mapsKey.length - 4)} | length=${mapsKey.length}`
        : 'MISSING'
);

const app = express();


// ==============================
// Middleware
// ==============================

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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
// MongoDB
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
// Google Maps Key
// ==============================

app.get('/api/maps-key', (req, res) => {

    console.log('GET /api/maps-key received');

    const key = process.env.GOOGLE_MAPS_API_KEY;

    if (!key) {
        console.log('GOOGLE_MAPS_API_KEY is missing');

        return res.status(500).json({
            success: false,
            message: 'Google Maps API Key is missing'
        });
    }

    console.log('Google Maps API key found');

    res.json({
        success: true,
        key: key
    });
});


// ==============================
// API Routes
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
// Public Static Files
// CSS / JS / Images
// ==============================

app.use(
    express.static(
        path.join(__dirname, 'public')
    )
);


// ==============================
// Page Authentication
// ==============================

const publicPages = [
    '/login.html',
    '/register.html'
];

app.use((req, res, next) => {

    // Login + Register פתוחים לכולם
    if (publicPages.includes(req.path)) {
        return next();
    }

    // כל HTML אחר דורש התחברות
    if (
        req.path.endsWith('.html') &&
        (
            !req.session ||
            !req.session.userId
        )
    ) {
        return res.redirect('/login.html');
    }

    next();
});


// ==============================
// Views
// ==============================

app.use(
    express.static(
        path.join(__dirname, 'views')
    )
);


// ==============================
// Main Page
// ==============================

app.get('/', (req, res) => {

    if (
        req.session &&
        req.session.userId
    ) {
        return res.redirect('/homePage.html');
    }

    res.redirect('/login.html');
});


// ==============================
// Start Server
// ==============================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {

    console.log(`Server file: ${__filename}`);

    console.log(
        `Server is running at http://localhost:${PORT}`
    );

    console.log(
        `Maps test: http://localhost:${PORT}/api/maps-key`
    );
});