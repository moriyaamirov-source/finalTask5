const Group = require('../models/Group');
const mongoose = require('mongoose');


// ========================================
// CREATE GROUP
// רק משתמש מחובר יכול ליצור קבוצה
// המשתמש שיוצר את הקבוצה הופך אוטומטית ל-admin
// וגם לחבר בקבוצה
// ========================================
exports.createGroup = async (req, res) => {
    try {
        const {
            name,
            description,
            region
        } = req.body;

        if (
            !name ||
            !String(name).trim() ||
            !region ||
            !String(region).trim()
        ) {
            return res.status(400).json({
                message: 'Name and region are required'
            });
        }

        const newGroup = new Group({
            name: String(name).trim(),

            description:
                description !== undefined
                    ? String(description).trim()
                    : '',

            region: String(region).trim(),

            // המשתמש המחובר הוא מנהל הקבוצה
            admin: req.session.userId,

            // היוצר הוא גם חבר אוטומטית
            members: [req.session.userId]
        });

        const savedGroup =
            await newGroup.save();

        const populatedGroup =
            await Group.findById(savedGroup._id)
                .populate('admin', 'username')
                .populate('members', 'username');

        res.status(201).json(
            populatedGroup
        );

    } catch (err) {
        console.error(
            'Error creating group:',
            err
        );

        if (err.code === 11000) {
            return res.status(409).json({
                message:
                    'Group name already exists'
            });
        }

        res.status(400).json({
            message: err.message
        });
    }
};


// ========================================
// GET ALL GROUPS
// ========================================
exports.getGroups = async (req, res) => {
    try {
        const groups =
            await Group.find()
                .populate(
                    'admin',
                    'username'
                )
                .populate(
                    'members',
                    'username'
                )
                .sort({
                    createdAt: -1
                });

        res.status(200).json(
            groups
        );

    } catch (err) {
        console.error(
            'Error fetching groups:',
            err
        );

        res.status(500).json({
            message:
                'Failed to fetch groups'
        });
    }
};


// ========================================
// GET GROUP BY ID
// ========================================
exports.getGroupById = async (req, res) => {
    try {
        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.id
            )
        ) {
            return res.status(400).json({
                message:
                    'Invalid group ID'
            });
        }

        const group =
            await Group.findById(
                req.params.id
            )
                .populate(
                    'admin',
                    'username'
                )
                .populate(
                    'members',
                    'username'
                );

        if (!group) {
            return res.status(404).json({
                message:
                    'Group not found'
            });
        }

        res.status(200).json(
            group
        );

    } catch (err) {
        console.error(
            'Error fetching group:',
            err
        );

        res.status(500).json({
            message:
                'Failed to fetch group'
        });
    }
};


// ========================================
// UPDATE GROUP
// רק ה-admin של הקבוצה יכול לעדכן
// ========================================
exports.updateGroup = async (req, res) => {
    try {
        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.id
            )
        ) {
            return res.status(400).json({
                message:
                    'Invalid group ID'
            });
        }

        const group =
            await Group.findById(
                req.params.id
            );

        if (!group) {
            return res.status(404).json({
                message:
                    'Group not found'
            });
        }

        // רק מנהל הקבוצה יכול לערוך
        if (
            !group.admin ||
            String(group.admin) !==
                String(req.session.userId)
        ) {
            return res.status(403).json({
                message:
                    'Permission denied: Only the group admin can update this group'
            });
        }

        const {
            name,
            description,
            region
        } = req.body;

        if (name !== undefined) {
            if (!String(name).trim()) {
                return res.status(400).json({
                    message:
                        'Group name cannot be empty'
                });
            }

            group.name =
                String(name).trim();
        }

        if (description !== undefined) {
            group.description =
                String(description).trim();
        }

        if (region !== undefined) {
            if (!String(region).trim()) {
                return res.status(400).json({
                    message:
                        'Region cannot be empty'
                });
            }

            group.region =
                String(region).trim();
        }

        // לא מאפשרים ללקוח לשנות members
        // דרך פעולת update רגילה.
        // Join / Leave מטפלים בחברות בקבוצה.

        const updatedGroup =
            await group.save();

        const populatedGroup =
            await Group.findById(
                updatedGroup._id
            )
                .populate(
                    'admin',
                    'username'
                )
                .populate(
                    'members',
                    'username'
                );

        res.status(200).json(
            populatedGroup
        );

    } catch (err) {
        console.error(
            'Error updating group:',
            err
        );

        if (err.code === 11000) {
            return res.status(409).json({
                message:
                    'Group name already exists'
            });
        }

        res.status(400).json({
            message: err.message
        });
    }
};


// ========================================
// DELETE GROUP
// רק ה-admin של הקבוצה יכול למחוק
// ========================================
exports.deleteGroup = async (req, res) => {
    try {
        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.id
            )
        ) {
            return res.status(400).json({
                message:
                    'Invalid group ID'
            });
        }

        const group =
            await Group.findById(
                req.params.id
            );

        if (!group) {
            return res.status(404).json({
                message:
                    'Group not found'
            });
        }

        if (
            !group.admin ||
            String(group.admin) !==
                String(req.session.userId)
        ) {
            return res.status(403).json({
                message:
                    'Permission denied: Only the group admin can delete this group'
            });
        }

        await Group.findByIdAndDelete(
            req.params.id
        );

        res.status(200).json({
            message:
                'Group deleted successfully'
        });

    } catch (err) {
        console.error(
            'Error deleting group:',
            err
        );

        res.status(500).json({
            message:
                'Failed to delete group'
        });
    }
};


// ========================================
// JOIN GROUP
// משתמש מחובר מצטרף לקבוצה
// ========================================
exports.joinGroup = async (req, res) => {
    try {
        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.id
            )
        ) {
            return res.status(400).json({
                message:
                    'Invalid group ID'
            });
        }

        const group =
            await Group.findById(
                req.params.id
            );

        if (!group) {
            return res.status(404).json({
                message:
                    'Group not found'
            });
        }

        const userId =
            String(req.session.userId);

        const alreadyMember =
            group.members.some(
                memberId =>
                    String(memberId) ===
                    userId
            );

        if (alreadyMember) {
            return res.status(200).json({
                message:
                    'User is already a member',
                group
            });
        }

        group.members.push(
            req.session.userId
        );

        await group.save();

        const populatedGroup =
            await Group.findById(
                group._id
            )
                .populate(
                    'admin',
                    'username'
                )
                .populate(
                    'members',
                    'username'
                );

        res.status(200).json({
            message:
                'Joined group successfully',

            group:
                populatedGroup
        });

    } catch (err) {
        console.error(
            'Error joining group:',
            err
        );

        res.status(500).json({
            message:
                'Failed to join group'
        });
    }
};


// ========================================
// LEAVE GROUP
// משתמש מחובר עוזב קבוצה
// מנהל הקבוצה לא יכול לעזוב אותה
// ========================================
exports.leaveGroup = async (req, res) => {
    try {
        if (
            !mongoose.Types.ObjectId.isValid(
                req.params.id
            )
        ) {
            return res.status(400).json({
                message:
                    'Invalid group ID'
            });
        }

        const group =
            await Group.findById(
                req.params.id
            );

        if (!group) {
            return res.status(404).json({
                message:
                    'Group not found'
            });
        }

        const userId =
            String(req.session.userId);

        // מי שיצר את הקבוצה הוא המנהל
        // ולכן לא יכול פשוט לעזוב אותה
        if (
            group.admin &&
            String(group.admin) === userId
        ) {
            return res.status(400).json({
                message:
                    'Group admin cannot leave the group. Delete the group instead.'
            });
        }

        const isMember =
            group.members.some(
                memberId =>
                    String(memberId) ===
                    userId
            );

        if (!isMember) {
            return res.status(400).json({
                message:
                    'User is not a member of this group'
            });
        }

        group.members =
            group.members.filter(
                memberId =>
                    String(memberId) !==
                    userId
            );

        await group.save();

        const populatedGroup =
            await Group.findById(
                group._id
            )
                .populate(
                    'admin',
                    'username'
                )
                .populate(
                    'members',
                    'username'
                );

        res.status(200).json({
            message:
                'Left group successfully',

            group:
                populatedGroup
        });

    } catch (err) {
        console.error(
            'Error leaving group:',
            err
        );

        res.status(500).json({
            message:
                'Failed to leave group'
        });
    }
};