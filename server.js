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
// Static Files
// ==============================

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));


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
    console.log(`Server file: ${__filename}`);
    console.log(`Server is running at http://localhost:${PORT}/trips.html`);
    console.log(`Maps test: http://localhost:${PORT}/api/maps-key`);
});