const mongoose = require('mongoose');

const FriendshipSchema = new mongoose.Schema({
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  ],
  categories: {
    type: [String], 
    default: []
  },
  status: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'pending'
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Friendship', FriendshipSchema);