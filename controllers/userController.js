const User = require('../models/User');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


// CREATE
exports.createUser = async (req, res) => {
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
                message: 'Username already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            password: hashedPassword
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


// READ ALL
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


// READ BY ID
exports.getUserById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid user ID'
            });
        }

        const user = await User.findById(req.params.id)
            .select('-password');

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


// UPDATE OWN USER
exports.updateUser = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid user ID'
            });
        }

        if (String(req.session.userId) !== String(req.params.id)) {
            return res.status(403).json({
                message: 'Permission denied'
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

        req.session.username = updatedUser.username;

        res.status(200).json(updatedUser);

    } catch (err) {
        console.error('Error updating user:', err);

        res.status(500).json({
            message: 'Failed to update user'
        });
    }
};


// DELETE OWN USER
exports.deleteUser = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid user ID'
            });
        }

        if (String(req.session.userId) !== String(req.params.id)) {
            return res.status(403).json({
                message: 'Permission denied'
            });
        }

        const deletedUser = await User.findByIdAndDelete(req.params.id);

        if (!deletedUser) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // מסירים את המשתמש שנמחק מרשימות החברים של משתמשים אחרים
        await User.updateMany(
            {},
            {
                $pull: {
                    friends: deletedUser._id
                }
            }
        );

        req.session.destroy(() => {});

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


// GET MY FRIENDS
exports.getMyFriends = async (req, res) => {
    try {
        const user = await User.findById(req.session.userId)
            .populate('friends', 'username createdAt')
            .select('-password');

        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.status(200).json(user.friends);

    } catch (err) {
        console.error('Error fetching friends:', err);

        res.status(500).json({
            message: 'Failed to fetch friends'
        });
    }
};


// ADD FRIEND
exports.addFriend = async (req, res) => {
    try {
        const currentUserId = req.session.userId;
        const friendId = req.params.friendId;

        if (!mongoose.Types.ObjectId.isValid(friendId)) {
            return res.status(400).json({
                message: 'Invalid friend ID'
            });
        }

        if (String(currentUserId) === String(friendId)) {
            return res.status(400).json({
                message: 'You cannot add yourself as a friend'
            });
        }

        const friend = await User.findById(friendId);

        if (!friend) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const currentUser = await User.findById(currentUserId);

        if (!currentUser) {
            return res.status(404).json({
                message: 'Current user not found'
            });
        }

        const alreadyFriends = currentUser.friends.some(
            id => String(id) === String(friendId)
        );

        if (alreadyFriends) {
            return res.status(409).json({
                message: 'User is already your friend'
            });
        }

        // חברות הדדית
        await User.findByIdAndUpdate(
            currentUserId,
            {
                $addToSet: {
                    friends: friendId
                }
            }
        );

        await User.findByIdAndUpdate(
            friendId,
            {
                $addToSet: {
                    friends: currentUserId
                }
            }
        );

        const updatedUser = await User.findById(currentUserId)
            .populate('friends', 'username createdAt')
            .select('-password');

        res.status(200).json({
            message: 'Friend added successfully',
            friends: updatedUser.friends
        });

    } catch (err) {
        console.error('Error adding friend:', err);

        res.status(500).json({
            message: 'Failed to add friend'
        });
    }
};


// REMOVE FRIEND
exports.removeFriend = async (req, res) => {
    try {
        const currentUserId = req.session.userId;
        const friendId = req.params.friendId;

        if (!mongoose.Types.ObjectId.isValid(friendId)) {
            return res.status(400).json({
                message: 'Invalid friend ID'
            });
        }

        if (String(currentUserId) === String(friendId)) {
            return res.status(400).json({
                message: 'Invalid friend ID'
            });
        }

        const friend = await User.findById(friendId);

        if (!friend) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        // הסרה משני הצדדים
        await User.findByIdAndUpdate(
            currentUserId,
            {
                $pull: {
                    friends: friendId
                }
            }
        );

        await User.findByIdAndUpdate(
            friendId,
            {
                $pull: {
                    friends: currentUserId
                }
            }
        );

        const updatedUser = await User.findById(currentUserId)
            .populate('friends', 'username createdAt')
            .select('-password');

        res.status(200).json({
            message: 'Friend removed successfully',
            friends: updatedUser.friends
        });

    } catch (err) {
        console.error('Error removing friend:', err);

        res.status(500).json({
            message: 'Failed to remove friend'
        });
    }
};