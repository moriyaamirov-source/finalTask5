const mongoose = require('mongoose');
const Group = require('../models/Group');
const Post = require('../models/Post');


// CREATE POST IN GROUP
exports.createGroupPost = async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.session.userId;

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({
                message: 'Invalid group ID'
            });
        }

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: 'Group not found'
            });
        }

        const isAdmin =
            group.admin &&
            String(group.admin) === String(userId);

        const isMember = group.members.some(
            memberId => String(memberId) === String(userId)
        );

        if (!isAdmin && !isMember) {
            return res.status(403).json({
                message: 'You must be a group member to publish a post'
            });
        }

        const {
            title,
            content,
            postType,
            mediaUrl
        } = req.body;

        if (
            !title ||
            !String(title).trim() ||
            !content ||
            !String(content).trim()
        ) {
            return res.status(400).json({
                message: 'Title and content are required'
            });
        }

        const newPost = new Post({
            title: String(title).trim(),
            content: String(content).trim(),
            postType: postType || 'text',
            mediaUrl:
                mediaUrl !== undefined
                    ? String(mediaUrl).trim()
                    : undefined,
            author: userId,
            group: groupId
        });

        const savedPost = await newPost.save();

        const populatedPost = await Post.findById(savedPost._id)
            .populate('author', 'username')
            .populate('group', 'name region');

        res.status(201).json(populatedPost);

    } catch (err) {
        console.error('Error creating group post:', err);

        res.status(500).json({
            message: 'Failed to create group post'
        });
    }
};


// GET POSTS OF ONE GROUP
exports.getGroupPosts = async (req, res) => {
    try {
        const groupId = req.params.id;
        const userId = req.session.userId;

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({
                message: 'Invalid group ID'
            });
        }

        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                message: 'Group not found'
            });
        }

        const isAdmin =
            group.admin &&
            String(group.admin) === String(userId);

        const isMember = group.members.some(
            memberId => String(memberId) === String(userId)
        );

        if (!isAdmin && !isMember) {
            return res.status(403).json({
                message: 'You must be a group member to view group posts'
            });
        }

        const posts = await Post.find({
            group: groupId
        })
            .populate('author', 'username')
            .populate('group', 'name region')
            .sort({
                createdAt: -1
            });

        res.status(200).json(posts);

    } catch (err) {
        console.error('Error fetching group posts:', err);

        res.status(500).json({
            message: 'Failed to fetch group posts'
        });
    }
};