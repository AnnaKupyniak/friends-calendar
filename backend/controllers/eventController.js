const Event = require('../models/Event');
const Friendship = require('../models/Friendship');
const Group = require('../models/Group');

// GET /api/events — всі події поточного користувача
const getEvents = async (req, res) => {
  try {
    const userId = req.user._id;

    // Знайти всі дружби де є цей юзер
    const friendships = await Friendship.find({ users: userId });
    const friendshipIds = friendships.map((f) => f._id);

    // Знайти всі групи де є цей юзер
    const groups = await Group.find({ members: userId });
    const groupIds = groups.map((g) => g._id);

    // Знайти всі події по цих сутностях
    const events = await Event.find({
      $or: [
        { entityType: 'Friendship', entity: { $in: friendshipIds } },
        { entityType: 'Group', entity: { $in: groupIds } },
      ],
    }).sort({ date: 1 });

    res.json({ events });
  } catch (err) {
    console.error('getEvents error:', err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

// POST /api/events — створити подію
const createEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, description, date, time, place, color, entityType, entity } = req.body;

    if (!title || !date || !entityType || !entity) {
      return res.status(400).json({ message: "Заповніть обов'язкові поля" });
    }

    const event = await Event.create({
      title,
      description,
      date,
      time,
      place,
      color: color || '#F5811F',
      entityType,
      entity,
      createdBy: userId,
    });

    res.status(201).json({ event });
  } catch (err) {
    console.error('createEvent error:', err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

// PUT /api/events/:id — оновити подію
const updateEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ message: 'Подію не знайдено' });
    if (String(event.createdBy) !== String(userId)) {
      return res.status(403).json({ message: 'Немає доступу' });
    }

    const { title, description, date, time, place, color } = req.body;
    if (title !== undefined) event.title = title;
    if (description !== undefined) event.description = description;
    if (date !== undefined) event.date = date;
    if (time !== undefined) event.time = time;
    if (place !== undefined) event.place = place;
    if (color !== undefined) event.color = color;

    await event.save();
    res.json({ event });
  } catch (err) {
    console.error('updateEvent error:', err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

// DELETE /api/events/:id — видалити подію
const deleteEvent = async (req, res) => {
  try {
    const userId = req.user._id;
    const event = await Event.findById(req.params.id);

    if (!event) return res.status(404).json({ message: 'Подію не знайдено' });
    if (String(event.createdBy) !== String(userId)) {
      return res.status(403).json({ message: 'Немає доступу' });
    }

    await event.deleteOne();
    res.json({ message: 'Подію видалено' });
  } catch (err) {
    console.error('deleteEvent error:', err);
    res.status(500).json({ message: 'Помилка сервера' });
  }
};

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };
