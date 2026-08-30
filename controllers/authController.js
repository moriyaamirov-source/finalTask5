const User = require('../models/User');
const bcrypt = require('bcryptjs');


// REGISTER
exports.register = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: 'Username and password are required'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: 'Password must contain at least 6 characters'
            });
        }

        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(409).json({
                message: 'Username already taken'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).json({
            message: 'User registered successfully'
        });

    } catch (err) {
        console.error('Register error:', err);

        res.status(500).json({
            message: 'Failed to register user'
        });
    }
};


// LOGIN
exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: 'Username and password are required'
            });
        }

        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({
                message: 'Invalid username or password'
            });
        }

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Invalid username or password'
            });
        }

        // מונע שימוש חוזר ב-session ישן
        await new Promise((resolve, reject) => {
            req.session.regenerate(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        req.session.userId = user._id.toString();
        req.session.username = user.username;

        await new Promise((resolve, reject) => {
            req.session.save(err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username
            }
        });

    } catch (err) {
        console.error('Login error:', err);

        res.status(500).json({
            message: 'Failed to login'
        });
    }
};


// LOGOUT
exports.logout = (req, res) => {
    if (!req.session) {
        return res.status(200).json({
            message: 'Logout successful'
        });
    }

    req.session.destroy(err => {
        if (err) {
            console.error('Logout error:', err);

            return res.status(500).json({
                message: 'Failed to logout'
            });
        }

        res.clearCookie('connect.sid');

        res.status(200).json({
            message: 'Logout successful'
        });
    });
};


// CURRENT USER
exports.getCurrentUser = (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({
            message: 'Not authenticated'
        });
    }

    res.status(200).json({
        user: {
            id: req.session.userId,
            username: req.session.username
        }
    });
};