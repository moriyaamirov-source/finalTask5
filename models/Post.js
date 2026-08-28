const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    postType: { 
        type: String, 
        enum: ['text', 'image', 'video'], 
        default: 'text' 
    },
    mediaUrl: { type: String },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // שדות מיקום עבור המפה הדיגיטלית (Google Maps)
    location: {
        address: { type: String, default: '' }, 
        lat: { type: Number },                   
        lng: { type: Number }                    
    },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);