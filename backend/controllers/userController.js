const Friendship = require('../models/Friendship');
const Memory = require('../models/Memory');
const User = require('../models/User');


exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const friendships = await Friendship.find({ 
      users: req.user._id,
      status: 'accepted'
    }).populate('users', 'username fullName avatar');
    res.json({ friendships });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
};

exports.getFriendRequests = async (req, res) => {
  try {
    const requests = await Friendship.find({ 
      users: req.user._id,
      status: 'pending',
      requester: { $ne: req.user._id }
    }).populate('requester', 'username fullName avatar');
    
    // Додаємо налагодження
    console.log(`User ${req.user.username} (ID: ${req.user._id}) has ${requests.length} incoming requests`);
    
    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
};

exports.findFriend = async (req, res) => {
  const userId = req.user.id;
  let { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Пошуковий запит є обов’язковим' });
  }

  // Sanitize and limit query to prevent ReDoS attacks
  query = String(query).trim().slice(0, 50);
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    const regex = new RegExp(escapedQuery, 'i');
    const results = await User.find({
      _id: { $ne: user._id },
      $or: [
        { username: { $regex: regex } },
        { fullName: { $regex: regex } }
      ]
    }).select('username fullName avatar');

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
};

exports.addFriend = async (req, res) => {
  const { friendId } = req.body;

  try {
    const exists = await Friendship.findOne({ users: { $all: [req.user._id, friendId] } });
    if (exists) {
      const msg = exists.status === 'pending' ? 'Запит уже очікує підтвердження' : 'Дружба вже існує';
      return res.status(400).json({ message: msg });
    }

    const friendship = await Friendship.create({ 
      users: [req.user._id, friendId],
      requester: req.user._id,
      status: 'pending'
    })

    res.status(201).json({ message: 'Запит у друзі надіслано', friendship });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
};

exports.acceptFriendRequest = async (req, res) => {
  const { requesterId } = req.body;
  try {
    const friendship = await Friendship.findOne({ 
      users: { $all: [req.user._id, requesterId] },
      status: 'pending'
    });

    if (!friendship) return res.status(404).json({ message: 'Запит не знайдено' });

    friendship.status = 'accepted';
    await friendship.save();

    res.json({ message: 'Запит у друзі прийнято', friendship });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
};

exports.declineFriendRequest = async (req, res) => {
  const { requesterId } = req.body;
  try {
    const friendship = await Friendship.findOneAndDelete({ 
      users: { $all: [req.user._id, requesterId] },
      status: 'pending'
    });

    if (!friendship) return res.status(404).json({ message: 'Запит не знайдено' });

    res.json({ message: 'Запит у друзі відхилено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
};

exports.removeFriend = async (req, res) => {
  const { friendId } = req.query;
  try {
    const friendship = await Friendship.findOneAndDelete({ users: { $all: [req.user._id, friendId] } });
    if (!friendship) return res.status(404).json({ message: 'Дружбу не знайдено' });
    await Memory.deleteMany({entity: friendship._id, entityType: 'Friendship'})

    res.json({ message: 'Друга видалено' });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
}

exports.addCategoryToFriendship = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const { category } = req.body;

    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return res.status(404).json({ message: 'Дружбу не знайдено' });
    }

    if (!friendship.users.includes(req.user._id)) {
      return res.status(403).json({ message: 'Недостатньо прав доступу' });
    }

    if (!friendship.categories.includes(category)) {
      friendship.categories.push(category);
      await friendship.save();
    }

    res.json({ 
      message: 'Категорію додано', 
      categories: friendship.categories 
    });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { fullName, username } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'Користувача не знайдено' });

    if (fullName !== undefined) user.fullName = fullName;
    if (username !== undefined) user.username = username;

    await user.save();
    res.json({ user: { _id: user._id, username: user.username, fullName: user.fullName, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ message: 'Помилка сервера', error: err.message });
  }
};