const User = require('../models/User');

// הרשמת משתמש חדש (Register)
exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // בדיקה אם המשתמש כבר קיים
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already taken' });
        }

        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// התחברות משתמש (Login)
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        // במערכת אמיתית נרצה לשמור סשן או טוקן, כרגע נחזיר הצלחה
        res.json({ message: 'Login successful', userId: user._id, username: user.username });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};