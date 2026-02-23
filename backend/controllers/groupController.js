const Group = require('../models/Group');
const Memory = require('../models/Memory');
const mongoose = require('mongoose')

exports.createGroup = async (req, res) => {
    try {
        const members = new Set([req.user.id, ...(req.body.members || [])]);

        const groupData = {
            ...req.body,
            owner: req.user.id,
            members: [...members]
        };

        const group = await Group.create(groupData);

        await group.populate('owner', 'username fullName avatar');
        await group.populate('members', 'username fullName avatar');

        res.status(201).json({
            success: true,
            data: group
        });
    } catch (err) {
        console.error('Error creating group:', err);
        res.status(400).json({
            success: false,
            message: 'Error creating group',
            error: err.message
        });
    }
};

exports.getGroupById = async (req, res) => {
    const groupId = req.params.id;

    try {
        const group = await Group.findById(groupId)
            .populate('owner', 'username fullName avatar')
            .populate('members', 'username fullName avatar');

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }
        if (!group.members.some(m => m._id.toString() === req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        res.status(200).json({
            success: true,
            data: group
        });
    } catch (err) {
        console.error('Error fetching group:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching group',
            error: err.message
        });
    }
};


exports.getAllGroups = async (req, res) => {
    try {
        const groups = await Group.find({
            members: req.user.id
        })
            .populate('owner', 'username fullName avatar')
            .populate('members', 'username fullName avatar')
            .sort('-createdAt');

        res.status(200).json({
            success: true,
            count: groups.length,
            groups
        });
    } catch (err) {
        console.error('Error fetching groups:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching groups',
            error: err.message
        });
    }
};

exports.updateGroup = async (req, res) => {
    const groupId = req.params.id;

    try {
        let group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        if (!group.members.some(m => m._id.toString() === req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        group = await Group.findByIdAndUpdate(
            groupId,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('owner', 'username fullName avatar')
            .populate('members', 'username fullName avatar');

        res.status(200).json({
            success: true,
            data: group
        });
    } catch (err) {
        console.error('Error updating group:', err);
        res.status(500).json({
            success: false,
            message: 'Error updating group',
            error: err.message
        });
    }
};

exports.deleteGroup = async (req, res) => {
    const groupId = req.params.id;

    try {
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        if (group.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only the group owner can delete the group'
            });
        }

        await group.deleteOne();
        await Memory.deleteMany({ entity: groupId, entityType: 'Group' });

        res.status(200).json({
            success: true,
            message: 'Group deleted successfully'
        });
    } catch (err) {
        console.error('Error deleting group:', err);
        res.status(500).json({
            success: false,
            message: 'Error deleting group',
            error: err.message
        });
    }
};

exports.addMembers = async (req, res) => {
    const groupId = req.params.id;
    const { userIds } = req.body;

    try {
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        if (!group.members.some(m => m._id.toString() === req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        const newMembers = userIds.filter(
            id => !group.members.some(m => m.toString() === id)
        );
        group.members.push(...newMembers);

        await group.save();
        await group.populate('members', 'username fullName avatar');

        res.status(200).json({
            success: true,
            data: group
        });
    } catch (err) {
        console.error('Error adding members:', err);
        res.status(500).json({
            success: false,
            message: 'Error adding members',
            error: err.message
        });
    }
};
exports.removeMember = async (req, res) => {
    const { id: groupId, memberId } = req.params;

    try {
        console.log(`Removing member ${memberId} from group ${groupId}`);
        if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(memberId)) {
            return res.status(400).json({ success: false, message: 'Невалідний ID' });
        }

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ success: false, message: 'Групу не знайдено' });
        }

        if (group.owner.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Ви не власник групи' });
        }

        const memberObjectId = new mongoose.Types.ObjectId(memberId);
        const isMember = group.members.some(m => m.equals(memberObjectId));
        if (!isMember) {
            return res.status(404).json({ success: false, message: 'Учасника не знайдено в групі' });
        }

        const updatedGroup = await Group.findOneAndUpdate(
            { _id: groupId },
            { $pull: { members: memberObjectId } }, 
            { new: true }
        ).populate('members', 'username fullName avatar');

        res.status(200).json({
            success: true,
            group: updatedGroup
        });
    } catch (err) {
        console.error('ПОМИЛКА:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.addCategoryToGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { category } = req.body;

        const group = await Group.findById(groupId);
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (!group.members.some(m => m.toString() === req.user.id))

            if (!group.categories.includes(category)) {
                group.categories.push(category);
                await group.save();
            }

        res.json({
            message: 'Category added',
            categories: group.categories
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};