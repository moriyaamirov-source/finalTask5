const Group = require('../models/Group');
const mongoose = require('mongoose');


// CREATE - יצירת קבוצה חדשה
exports.createGroup = async (req, res) => {
    try {
        const { name, description, region, admin, members } = req.body;

        const newGroup = new Group({
            name,
            description,
            region,
            admin,
            members: members || []
        });

        const savedGroup = await newGroup.save();

        res.status(201).json(savedGroup);

    } catch (err) {
        console.error('Error creating group:', err);

        res.status(500).json({
            message: 'Failed to create group'
        });
    }
};


// READ - שליפת כל הקבוצות
exports.getAllGroups = async (req, res) => {
    try {
        const groups = await Group.find()
            .populate('admin', 'username')
            .populate('members', 'username');

        res.status(200).json(groups);

    } catch (err) {
        console.error('Error fetching groups:', err);

        res.status(500).json({
            message: 'Failed to fetch groups'
        });
    }
};


// READ - שליפת קבוצה לפי ID
exports.getGroupById = async (req, res) => {
    try {

        // בדיקה שה-ID בפורמט תקין של MongoDB
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


// UPDATE - עדכון קבוצה
exports.updateGroup = async (req, res) => {
    try {

        // בדיקה שה-ID בפורמט תקין של MongoDB
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid group ID'
            });
        }

        const {
            name,
            description,
            region,
            admin,
            members
        } = req.body;

        const updatedGroup = await Group.findByIdAndUpdate(
            req.params.id,
            {
                name,
                description,
                region,
                admin,
                members
            },
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedGroup) {
            return res.status(404).json({
                message: 'Group not found'
            });
        }

        res.status(200).json(updatedGroup);

    } catch (err) {
        console.error('Error updating group:', err);

        res.status(500).json({
            message: 'Failed to update group'
        });
    }
};


// DELETE - מחיקת קבוצה
exports.deleteGroup = async (req, res) => {
    try {

        // בדיקה שה-ID בפורמט תקין של MongoDB
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({
                message: 'Invalid group ID'
            });
        }

        const deletedGroup = await Group.findByIdAndDelete(req.params.id);

        if (!deletedGroup) {
            return res.status(404).json({
                message: 'Group not found'
            });
        }

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