const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: { type: String, required: true }, // שם קבוצת הטיולים (למשל: "משפחות מטיילות בשבת")
    description: { type: String, required: true }, // על מה הקבוצה (תיאור קצר)
    region: { type: String, required: true }, // האזור המרכזי שבו הקבוצה מטיילת
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // המדריך / מנהל הקבוצה
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] // חברי הקבוצה שנרשמו אליה
});

module.exports = mongoose.model('Group', groupSchema);