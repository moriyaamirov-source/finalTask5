const User = require('../models/User');
const Group = require('../models/Group');
const Post = require('../models/Post');


// ========================================
// MY POSTS
// כל הפוסטים שהמשתמש המחובר פרסם
// ========================================

exports.getMyPosts = async (req, res) => {
    try {
        const userId = req.session.userId;

        const posts = await Post.find({
            author: userId
        })
            .populate('author', 'username')
            .populate('group', 'name region')
            .sort({
                createdAt: -1
            });

        res.status(200).json(posts);

    } catch (err) {
        console.error('Error fetching my posts:', err);

        res.status(500).json({
            message: 'Failed to fetch your posts'
        });
    }
};


// ========================================
// FEED
// פוסטים של חברים +
// פוסטים של קבוצות שהמשתמש חבר בהן
// ========================================

exports.getFeed = async (req, res) => {
    try {
        const userId = req.session.userId;

        const currentUser = await User.findById(userId);

        if (!currentUser) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        const friendIds = currentUser.friends || [];

        // מוצאים את כל הקבוצות שהמשתמש חבר בהן.
        // admin נבדק גם בנפרד בשביל קבוצות ישנות.
        const groups = await Group.find({
            $or: [
                {
                    members: userId
                },
                {
                    admin: userId
                }
            ]
        }).select('_id');

        const groupIds = groups.map(
            group => group._id
        );

        const feedConditions = [];

        // פוסטים של חברים
        if (friendIds.length > 0) {
            feedConditions.push({
                author: {
                    $in: friendIds
                }
            });
        }

        // פוסטים של קבוצות שלי
        if (groupIds.length > 0) {
            feedConditions.push({
                group: {
                    $in: groupIds
                }
            });
        }

        // אם אין עדיין חברים ואין קבוצות
        if (feedConditions.length === 0) {
            return res.status(200).json([]);
        }

        const posts = await Post.find({
            $or: feedConditions
        })
            .populate('author', 'username')
            .populate('group', 'name region')
            .sort({
                createdAt: -1
            });

        res.status(200).json(posts);

    } catch (err) {
        console.error('Error fetching feed:', err);

        res.status(500).json({
            message: 'Failed to fetch feed'
        });
    }
};