const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
    title: { 
        type: String, 
        required: true 
    }, // שם הטיול או המסלול (למשל: "נחל צبייה", "שמורת עין גדי")
    content: { 
        type: String, 
        required: true 
    }, // תוכן הביקורת / חוויות מהטיול
    location: { 
        type: String, 
        required: true 
    }, // אזור בארץ (למשל: בצפון, בדרום, ירושלים והסביבה)
    rating: { 
        type: Number, 
        required: true, 
        min: 1, 
        max: 5 
    }, // דירוג הטיול (1 עד 5 כוכבים - מצוין לחיפושים וסינונים!)
    mediaType: { 
        type: String, 
        enum: ['text', 'image', 'video'], 
        default: 'text' 
    }, // האם יש תמונה או סרטון מהמסלול
    mediaUrl: { 
        type: String 
    }, // קישור לתמונה או וידאו מהטיול
    author: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    }, // המשתמש שכתב את הביקורת
    date: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Post', PostSchema);