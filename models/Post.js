const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    postType: { 
        type: String, 
        enum: ['text', 'image', 'video'], 
        default: 'text' 
    },
    mediaUrl: { type: String }, // קישור לתמונה או וידאו במידת הצורך
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // שיוך למשתמש
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);