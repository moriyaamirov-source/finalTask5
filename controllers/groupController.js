const Group = require('../models/Group');
const mongoose = require('mongoose');


// ========================================
// CREATE GROUP
// רק משתמש מחובר יכול ליצור קבוצה
// המשתמש שיוצר את הקבוצה הופך אוטומטית ל-admin
// ========================================
exports.createGroup = async (req, res) => {
    try {
        const {
            name,
            description,
            region,
            members
        } = req.body;

        if (!name || !region) {
            return res.status(400).json({
                message: 'Name and region are required'
            });
        }

        const newGroup = new Group({
            name,
            description,
            region,

            // לא מקבלים admin מהלקוח
            // המשתמש המחובר הוא האדמין
            admin: req.session.userId,

            members: members || []
        });

        const savedGroup = await newGroup.save();

        const populatedGroup = await Group.findById(savedGroup._id)
            .populate('admin', 'username')
            .populate('members', 'username');

        res.status(201).json(populatedGroup);

    } catch (err) {
        console.error('Error creating group:', err);

        if (err.code === 11000) {
            return res.status(409).json({
                message: 'Group name already exists'
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
        const groups = await Group.find()
            .populate('admin', 'username')
            .populate('members', 'username')
            .sort({ createdAt: -1 });

        res.status(200).json(groups);

    } catch (err) {
        console.error('Error fetching groups:', err);

        res.status(500).json({
            message: 'Failed to fetch groups'
        });
    }
};


// ========================================
// GET GROUP BY ID
// ========================================
exports.getGroupById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid group ID'
            });
        }

        const group = await Group.findById(req.params.id)
            .populate('admin', 'username')
            .populate('members', 'username');

        if (!group) {
            return res.status(404).json({
                message: 'Group not found'
            });
        }

        res.status(200).json(group);

    } catch (err) {
        console.error('Error fetching group:', err);

        res.status(500).json({
            message: 'Failed to fetch group'
        });
    }
};


// ========================================
// UPDATE GROUP
// רק ה-admin של הקבוצה יכול לעדכן
// ========================================
exports.updateGroup = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid group ID'
            });
        }

        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({
                message: 'Group not found'
            });
        }

        // בדיקת הרשאה
        if (
            !group.admin ||
            group.admin.toString() !== req.session.userId
        ) {
            return res.status(403).json({
                message: 'Permission denied: Only the group admin can update this group'
            });
        }

        const {
            name,
            description,
            region,
            members
        } = req.body;

        // מעדכנים רק שדות שהגיעו בבקשה
        if (name !== undefined) {
            group.name = name;
        }

        if (description !== undefined) {
            group.description = description;
        }

        if (region !== undefined) {
            group.region = region;
        }

        if (members !== undefined) {
            group.members = members;
        }

        const updatedGroup = await group.save();

        const populatedGroup = await Group.findById(updatedGroup._id)
            .populate('admin', 'username')
            .populate('members', 'username');

        res.status(200).json(populatedGroup);

    } catch (err) {
        console.error('Error updating group:', err);

        if (err.code === 11000) {
            return res.status(409).json({
                message: 'Group name already exists'
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
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid group ID'
            });
        }

        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({
                message: 'Group not found'
            });
        }

        // בדיקת הרשאה
        if (
            !group.admin ||
            group.admin.toString() !== req.session.userId
        ) {
            return res.status(403).json({
                message: 'Permission denied: Only the group admin can delete this group'
            });
        }

        await Group.findByIdAndDelete(req.params.id);

        res.status(200).json({
            message: 'Group deleted successfully'
        });

    } catch (err) {
        console.error('Error deleting group:', err);

        res.status(500).json({
            message: 'Failed to delete group'
        });
    }
};