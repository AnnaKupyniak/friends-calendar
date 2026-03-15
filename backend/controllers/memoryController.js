const Memory = require('../models/Memory');
const Friendship = require('../models/Friendship');
const Group = require('../models/Group');
const upload = require('../middleware/upload');

exports.createMemory = async (req, res) => {
  try {
    const { entityId, entityType, title, description, date, place, category } = req.body;

    if (!entityId || !entityType || !title || !description || !date || !place) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: entityId, entityType, title, description, date, place'
      });
    }

    if (!['Friendship', 'Group'].includes(entityType)) {
      return res.status(400).json({ success: false, message: 'Invalid entityType. Must be "Friendship" or "Group"' });
    }

    if (entityType === 'Friendship') {
      const friendship = await Friendship.findById(entityId);
      if (!friendship) {
        return res.status(404).json({ success: false, message: 'Friendship not found' });
      }

      const userId = req.user.id;
      if (!friendship.users.some(u => u.toString() === userId)) {
        return res.status(403).json({ success: false, message: 'You are not part of this friendship' });
      }
    } else if (entityType === 'Group') {
      const group = await Group.findById(entityId);
      if (!group) {
        return res.status(404).json({ success: false, message: 'Group not found' });
      }

      const userId = req.user.id;
      if (!group.members.some(u => u.toString() === userId)) {
        return res.status(403).json({ success: false, message: 'You are not a member of this group' });
      }
    }

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => `/uploads/${file.filename}`);
      console.log("Images saved:", imageUrls);
    }

    const memory = await Memory.create({
      title,
      description,
      date,
      place,
      category: category || '',
      imageUrls: imageUrls,
      entityType,
      entity: entityId
    });

    res.status(201).json({ success: true, data: memory });
  } catch (err) {
    console.error('Error creating memory:', err);
    res.status(400).json({
      success: false,
      message: 'Error creating memory',
      error: err.message
    });
  }
};

exports.createComment = async (req, res) => {
  try {
    const memoryId = req.params.id;
    const { text } = req.body;

    if (!memoryId || !text?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'memoryId and text are required'
      });
    }

    const memory = await Memory.findById(memoryId);
    if (!memory) {
      return res.status(404).json({
        success: false,
        message: 'Memory not found'
      });
    }

    memory.comments.push({
      text: text.trim(),
      author: req.user.fullName || 'Анонім'
    });

    await memory.save();

    res.status(201).json({
      success: true,
      data: memory.comments[memory.comments.length - 1]
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      message: 'Error creating comment',
      error: err.message
    });
  }
};

exports.getComments = async(req,res) =>{
  try{
    const memoryId = req.params.id;
    const memory = await Memory.findById(memoryId);
    if (!memory) {
      return res.status(404).json({
        success: false,
        message: 'Memory not found'
      });
    }

    res.status(200).json({success: true, data: memory.comments})

  }catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      message: 'Error comment',
      error: err.message
    });
  }
}

exports.getAllUserMemories = async (req, res) => {
  try {
    const userId = req.user._id;

    const friendships = await Friendship.find({ users: userId });
    const friendshipIds = friendships.map(f => f._id);

    const groups = await Group.find({ members: userId });
    const groupIds = groups.map(g => g._id);

    const memories = await Memory.find({
      $or: [
        { entityType: 'Friendship', entity: { $in: friendshipIds } },
        { entityType: 'Group', entity: { $in: groupIds } }
      ]
    });

    res.status(200).json({ success: true, data: memories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching memories', error: err.message });
  }
};

exports.getMemoriesForEntity = async (req, res) => {
  const { entityId } = req.params;

  try {
    const memories = await Memory.find({ entity: entityId });
    res.status(200).json({ success: true, data: memories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching memories', error: err.message });
  }
};

exports.updateMemory = async (req, res) => {
  const memoryId = req.params.id;

  try {
    const memory = await Memory.findById(memoryId);
    if (!memory) return res.status(404).json({ success: false, message: 'Memory not found' });

    let hasAccess = false;
    if (memory.entityType === 'Friendship') {
      const friendship = await Friendship.findById(memory.entity);
      hasAccess = friendship && friendship.users.some(u => u.toString() === req.user._id.toString());
    } else if (memory.entityType === 'Group') {
      const group = await Group.findById(memory.entity);
      hasAccess = group && group.members.some(u => u.toString() === req.user._id.toString());
    }

    if (!hasAccess) return res.status(403).json({ success: false, message: 'Not authorized' });

    Object.assign(memory, req.body);
    await memory.save();

    res.status(200).json({ success: true, data: memory });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Error updating memory', error: err.message });
  }
};

exports.deleteMemory = async (req, res) => {
  const memoryId = req.params.id;
  const userId = req.user.id;

  try {
    const memory = await Memory.findById(memoryId);
    if (!memory) {
      return res.status(404).json({
        success: false,
        message: 'Memory not found'
      });
    }

    let hasAccess = false;
    let entityExists = false;

    if (memory.entityType === 'Friendship') {
      const friendship = await Friendship.findById(memory.entity);
      entityExists = !!friendship;
      hasAccess = friendship && friendship.users.some(u => u.toString() === userId);
    }
    else if (memory.entityType === 'Group') {
      const group = await Group.findById(memory.entity);
      entityExists = !!group;
      hasAccess = group && group.members.some(u => u.toString() === userId);
    }

    if (!entityExists) {
      return res.status(404).json({
        success: false,
        message: 'Associated friendship or group no longer exists'
      });
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this memory'
      });
    }

    await Memory.findByIdAndDelete(memoryId);

    res.status(200).json({
      success: true,
      message: 'Memory deleted successfully'
    });

  } catch (err) {
    console.error('Error deleting memory:', err);
    res.status(500).json({
      success: false,
      message: 'Error deleting memory',
      error: err.message
    });
  }
};