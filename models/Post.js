const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },

    content: {
        type: String,
        required: true,
        trim: true
    },

    postType: {
        type: String,
        enum: ['text', 'image', 'video'],
        default: 'text'
    },

    mediaUrl: {
        type: String,
        trim: true
    },

    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // שדות של מסלול טיול
    region: {
        type: String,
        enum: ['צפון', 'מרכז', 'דרום']
    },

    duration: {
        type: Number,
        min: 0.5
    },

    difficulty: {
        type: String,
        enum: ['קל', 'בינוני', 'קשה']
    },

    // הכתובת נשמרת ב-MongoDB
    location: {
        address: {
            type: String,
            trim: true
        },

        lat: {
            type: Number,
            min: -90,
            max: 90
        },

        lng: {
            type: Number,
            min: -180,
            max: 180
        }
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Post', postSchema);