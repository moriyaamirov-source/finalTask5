const User = require('../models/User');
const mongoose = require('mongoose');


// CREATE - יצירת משתמש חדש
exports.createUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                message: 'Username and password are required'
            });
        }

        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(409).json({
                message: 'Username already exists'
            });
        }

        const newUser = new User({
            username,
            password
        });

        const savedUser = await newUser.save();

        res.status(201).json({
            _id: savedUser._id,
            username: savedUser.username,
            createdAt: savedUser.createdAt
        });

    } catch (err) {
        console.error('Error creating user:', err);

        res.status(500).json({
            message: 'Failed to create user'
        });
    }
};


// READ - שליפת כל המשתמשים
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');

        res.status(200).json(users);

    } catch (err) {
        console.error('Error fetching users:', err);

        res.status(500).json({
            message: 'Failed to fetch users'
        });
    }
};


// READ - שליפת משתמש לפי ID
exports.getUserById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid user ID'
            });
        }

        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.status(200).json(user);

    } catch (err) {
        console.error('Error fetching user:', err);

        res.status(500).json({
            message: 'Failed to fetch user'
        });
    }
};


// UPDATE - עדכון משתמש
exports.updateUser = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid user ID'
            });
        }

        const { username } = req.body;

        if (!username) {
            return res.status(400).json({
                message: 'Username is required'
            });
        }

        const existingUser = await User.findOne({
            username,
            _id: { $ne: req.params.id }
        });

        if (existingUser) {
            return res.status(409).json({
                message: 'Username already exists'
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { username },
            {
                new: true,
                runValidators: true
            }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.status(200).json(updatedUser);

    } catch (err) {
        console.error('Error updating user:', err);

        res.status(500).json({
            message: 'Failed to update user'
        });
    }
};


// DELETE - מחיקת משתמש
exports.deleteUser = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid user ID'
            });
        }

        const deletedUser = await User.findByIdAndDelete(req.params.id);

        if (!deletedUser) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.status(200).json({
            message: 'User deleted successfully'
        });

    } catch (err) {
        console.error('Error deleting user:', err);

        res.status(500).json({
            message: 'Failed to delete user'
        });
    }
};