const Memory = require('../models/Memory');
const Friendship = require('../models/Friendship');
const Group = require('../models/Group');
const fs = require('fs'); 
const path = require('path');

exports.createMemory = async (req, res) => {
  try {
    const { entityId, entityType, title, description, date, place, category } = req.body;

    if (!entityId || !entityType || !title || !description || !date || !place) {
      return res.status(400).json({
        success: false,
        message: 'Будь ласка, заповніть усі обов’язкові поля: entityId, entityType, title, description, date, place'
      });
    }

    if (!['Friendship', 'Group'].includes(entityType)) {
      return res.status(400).json({ success: false, message: 'Неправильний entityType. Має бути "Friendship" або "Group"' });
    }

    if (entityType === 'Friendship') {
      const friendship = await Friendship.findById(entityId);
      if (!friendship) {
        return res.status(404).json({ success: false, message: 'Дружбу не знайдено' });
      }

      const userId = req.user.id;
      if (!friendship.users.some(u => u.toString() === userId)) {
        return res.status(403).json({ success: false, message: 'Ви не є учасником цієї дружби' });
      }
    } else if (entityType === 'Group') {
      const group = await Group.findById(entityId);
      if (!group) {
        return res.status(404).json({ success: false, message: 'Групу не знайдено' });
      }

      const userId = req.user.id;
      if (!group.members.some(u => u.toString() === userId)) {
        return res.status(403).json({ success: false, message: 'Ви не є учасником цієї групи' });
      }
    }

    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => `/uploads/${file.filename}`);
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
      message: 'Помилка створення спогаду',
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
        message: 'Потрібні memoryId та текст'
      });
    }

    const memory = await Memory.findById(memoryId);
    if (!memory) {
      return res.status(404).json({
        success: false,
        message: 'Спогад не знайдено'
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
      message: 'Помилка створення коментаря',
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
        message: 'Спогад не знайдено'
      });
    }

    res.status(200).json({success: true, data: memory.comments})

  }catch (err) {
    console.error(err);
    res.status(400).json({
      success: false,
      message: 'Помилка отримання коментарів',
      error: err.message
    });
  }
}

exports.getAllUserMemories = async (req, res) => {
  try {
    const userId = req.user._id;
    const skip = parseInt(req.query.skip) || 0;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 per page

    const friendships = await Friendship.find({ users: userId });
    const friendshipIds = friendships.map(f => f._id);

    const groups = await Group.find({ members: userId });
    const groupIds = groups.map(g => g._id);

    const memories = await Memory.find({
      $or: [
        { entityType: 'Friendship', entity: { $in: friendshipIds } },
        { entityType: 'Group', entity: { $in: groupIds } }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

    res.status(200).json({ success: true, data: memories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Помилка завантаження спогадів', error: err.message });
  }
};

exports.getMemoriesForEntity = async (req, res) => {
  const { entityId } = req.params;

  try {
    const memories = await Memory.find({ entity: entityId });
    res.status(200).json({ success: true, data: memories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Помилка завантаження спогадів', error: err.message });
  }
};
exports.updateMemory = async (req, res) => {
  const memoryId = req.params.id;

  try {
    const memory = await Memory.findById(memoryId);
    if (!memory) return res.status(404).json({ success: false, message: 'Спогад не знайдено' });

    // --- Перевірка доступу (ваша логіка) ---
    let hasAccess = false;
    if (memory.entityType === 'Friendship') {
      const friendship = await Friendship.findById(memory.entity);
      hasAccess = friendship && friendship.users.some(u => u.toString() === req.user._id.toString());
    } else if (memory.entityType === 'Group') {
      const group = await Group.findById(memory.entity);
      hasAccess = group && group.members.some(u => u.toString() === req.user._id.toString());
    }

    if (!hasAccess) return res.status(403).json({ success: false, message: 'Недостатньо прав доступу' });

    // --- Логіка оновлення фото ---
    if (req.files && req.files.length > 0) {
      // 1. (Опціонально) Видаляємо старі фото з сервера, щоб не накопичувати сміття
      if (memory.imageUrls && memory.imageUrls.length > 0) {
        memory.imageUrls.forEach(url => {
          // url зазвичай "/uploads/filename.jpg", тому прибираємо перший слеш
          const filePath = path.join(__dirname, '..', url); 
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }

      // 2. Додаємо нові шляхи
      const newImageUrls = req.files.map(file => `/uploads/${file.filename}`);
      req.body.imageUrls = newImageUrls;
    }

    // --- Оновлення решти полів ---
    // Використовуємо Object.assign для title, description, date тощо
    Object.assign(memory, req.body);
    
    await memory.save();

    res.status(200).json({ success: true, data: memory });
  } catch (err) {
    console.error('Update error:', err);
    res.status(400).json({ success: false, message: 'Помилка оновлення спогаду', error: err.message });
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
          message: 'Спогад не знайдено'
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
          message: 'Пов’язана дружба або група більше не існує'
        });
    }

    if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Ви не маєте дозволу видаляти цей спогад'
        });
    }

    await Memory.findByIdAndDelete(memoryId);

    res.status(200).json({
      success: true,
      message: 'Спогад успішно видалено'
    });

  } catch (err) {
    console.error('Error deleting memory:', err);
    res.status(500).json({
      success: false,
      message: 'Помилка видалення спогаду',
      error: err.message
    });
  }
};

exports.searchAndFilterMemories = async (req, res) => {
  try {
    const userId = req.user._id;

    const {
      query,
      tags,
      startDate,
      endDate,
      place,
      category,
      sortBy = 'createdAt',
      skip = 0,
      limit = 50
    } = req.query;

    // --- helper для безпечного regex ---
    const escapeRegex = str =>
      str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // --- отримуємо дружби і групи ---
    const friendships = await Friendship.find({ users: userId }).select('_id');
    const groups = await Group.find({ members: userId }).select('_id');

    const friendshipIds = friendships.map(f => f._id);
    const groupIds = groups.map(g => g._id);

    // --- базовий фільтр доступу ---
    const filter = {
      $or: [
        { entityType: 'Friendship', entity: { $in: friendshipIds } },
        { entityType: 'Group', entity: { $in: groupIds } }
      ]
    };

    const andConditions = [];

    // --- TEXT SEARCH ---
    if (query) {
      const safeQuery = escapeRegex(query.trim());
      const regex = new RegExp(safeQuery, 'i');

      andConditions.push({
        $or: [
          { title: regex },
          { description: regex },
          { place: regex }
        ]
      });
    }

    // --- TAGS ---
    if (tags) {
      const tagArray = Array.isArray(tags)
        ? tags
        : tags.split(',');

      const normalizedTags = tagArray
        .map(t => t.trim())
        .filter(Boolean);

      if (normalizedTags.length > 0) {
        andConditions.push({
          tags: {
            $in: normalizedTags.map(t => new RegExp(`^${escapeRegex(t)}$`, 'i'))
          }
        });
      }
    }

    // --- DATE RANGE ---
    if (startDate || endDate) {
      const dateFilter = {};

      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start)) dateFilter.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end)) dateFilter.$lte = end;
      }

      if (Object.keys(dateFilter).length > 0) {
        andConditions.push({ date: dateFilter });
      }
    }

    // --- PLACE (окремо, щоб не конфліктував з query) ---
    if (place) {
      const safePlace = escapeRegex(place.trim());
      andConditions.push({
        place: new RegExp(safePlace, 'i')
      });
    }

    // --- CATEGORY ---
    if (category) {
      andConditions.push({ category });
    }

    // --- додаємо $and якщо є умови ---
    if (andConditions.length > 0) {
      filter.$and = andConditions;
    }

    // --- SORT ---
    const sortOptions = {};
    switch (sortBy) {
      case 'date':
        sortOptions.date = -1;
        break;
      case 'title':
        sortOptions.title = 1;
        break;
      case 'oldest':
        sortOptions.createdAt = 1;
        break;
      case 'newest':
      default:
        sortOptions.createdAt = -1;
    }

    // --- QUERY ---
    const memories = await Memory.find(filter)
      .sort(sortOptions)
      .skip(parseInt(skip))
      .limit(Math.min(parseInt(limit), 100))
      .lean();

    res.status(200).json({
      success: true,
      count: memories.length,
      data: memories
    });

  } catch (err) {
    console.error('Error searching memories:', err);
    res.status(500).json({
      success: false,
      message: 'Error searching memories',
      error: err.message
    });
  }
};

// Отримати всі теги користувача
exports.getAllTags = async (req, res) => {
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
    }).select('tags');

    const tagsSet = new Set();
    memories.forEach(memory => {
      if (memory.tags && Array.isArray(memory.tags)) {
        memory.tags.forEach(tag => tagsSet.add(tag));
      }
    });

    const tags = Array.from(tagsSet).sort();

    res.status(200).json({
      success: true,
      count: tags.length,
      data: tags
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Помилка завантаження тегів',
      error: err.message
    });
  }
};