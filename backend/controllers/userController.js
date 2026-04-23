const Friendship = require('../models/Friendship');
const Memory = require('../models/Memory');
const User = require('../models/User');


exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getFriends = async (req, res) => {
  try {
    const friendships = await Friendship.find({ users: req.user._id })
      .populate('users', 'username fullName avatar');
    res.json({ friendships });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.findFriend = async (req, res) => {
  const userId = req.user.id;
  let { query } = req.query;

  if (!query) {
    return res.status(400).json({ message: 'Query is required' });
  }

  // Sanitize and limit query to prevent ReDoS attacks
  query = String(query).trim().slice(0, 50);
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const regex = new RegExp(escapedQuery, 'i');
    const results = await User.find({
      //   _id: { $nin: [...user.friends, user._id] },
      $or: [
        { username: { $regex: regex } },
        { fullName: { $regex: regex } }
      ]
    }).select('username fullName avatar');

    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.addFriend = async (req, res) => {
  const { friendId } = req.body;

  try {
    const exists = await Friendship.findOne({ users: { $all: [req.user._id, friendId] } });
    if (exists) {
      return res.status(400).json({ message: 'Friendship already exists' });
    }

    const friendship = await Friendship.create({ users: [req.user._id, friendId] })

    // await friendship.populate('friends', 'username fullName avatar');

    res.status(201).json({ message: 'Friend added', friendship });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.removeFriend = async (req, res) => {
  const { friendId } = req.query;
  try {
    const friendship = await Friendship.findOneAndDelete({ users: { $all: [req.user._id, friendId] } });
    if (!friendship) return res.status(404).json({ message: 'Friendship not found' });
    await Memory.deleteMany({entity: friendship._id, entityType: 'Friendship'})

    res.json({ message: 'Friend removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
}

exports.addCategoryToFriendship = async (req, res) => {
  try {
    const { friendshipId } = req.params;
    const { category } = req.body;

    const friendship = await Friendship.findById(friendshipId);
    if (!friendship) {
      return res.status(404).json({ message: 'Friendship not found' });
    }

    if (!friendship.users.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!friendship.categories.includes(category)) {
      friendship.categories.push(category);
      await friendship.save();
    }

    res.json({ 
      message: 'Category added', 
      categories: friendship.categories 
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { fullName, username } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (fullName !== undefined) user.fullName = fullName;
    if (username !== undefined) user.username = username;

    await user.save();
    res.json({ user: { _id: user._id, username: user.username, fullName: user.fullName, avatar: user.avatar } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};