const Group = require('../models/Group');
const Memory = require('../models/Memory');
const mongoose = require('mongoose');

exports.createGroup = async (req, res) => {
    try {
        let groupData = { ...req.body };
        
        // Обробка членів групи (якщо приходять як JSON рядок)
        if (typeof req.body.members === 'string') {
            groupData.members = JSON.parse(req.body.members);
        }

        const membersList = new Set([req.user.id, ...(groupData.members || [])]);

        groupData = {
            ...groupData,
            owner: req.user.id,
            members: [...membersList]
        };

        // Додаємо аватар, якщо він був завантажений
        if (req.file) {
            groupData.avatar = req.file.filename;
        }

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

        let updateData = { ...req.body };
        if (req.file) {
            updateData.avatar = req.file.filename;
        }

        group = await Group.findByIdAndUpdate(
            groupId,
            updateData,
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

        // Тільки власник групи може її видалити
        if (group.owner.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Only group owner can delete the group'
            });
        }

        await Group.findByIdAndDelete(groupId);

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
    const { members } = req.body;

    try {
        let group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Перевірка, чи поточний користувач є членом групи
        if (!group.members.some(m => m._id.toString() === req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        // Додаємо нових членів
        const newMembers = Array.isArray(members) ? members : [members];
        const memberSet = new Set([...group.members.map(m => m.toString()), ...newMembers]);
        group.members = [...memberSet];

        await group.save();
        await group.populate('owner', 'username fullName avatar');
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
    const { id, memberId } = req.params;

    try {
        let group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Перевірка, чи поточний користувач є членом групи
        if (!group.members.some(m => m._id.toString() === req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        // Видаляємо члена
        group.members = group.members.filter(m => m.toString() !== memberId);

        await group.save();
        await group.populate('owner', 'username fullName avatar');
        await group.populate('members', 'username fullName avatar');

        res.status(200).json({
            success: true,
            data: group
        });
    } catch (err) {
        console.error('Error removing member:', err);
        res.status(500).json({
            success: false,
            message: 'Error removing member',
            error: err.message
        });
    }
};

exports.addCategoryToGroup = async (req, res) => {
    const groupId = req.params.id;
    const { category } = req.body;

    try {
        if (!category) {
            return res.status(400).json({
                success: false,
                message: 'Category is required'
            });
        }

        let group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // Перевірка, чи поточний користувач є членом групи
        if (!group.members.some(m => m._id.toString() === req.user.id)) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group'
            });
        }

        // Додаємо категорію, якщо її ще немає
        if (!group.categories.includes(category)) {
            group.categories.push(category);
            await group.save();
        }

        await group.populate('owner', 'username fullName avatar');
        await group.populate('members', 'username fullName avatar');

        res.status(200).json({
            success: true,
            data: group
        });
    } catch (err) {
        console.error('Error adding category:', err);
        res.status(500).json({
            success: false,
            message: 'Error adding category',
            error: err.message
        });
    }
};
