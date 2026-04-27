const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: ['new_message', 'new_comment', 'friend_request', 'memory_created', 'group_invite'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId
    },
    relatedModel: {
        type: String,
        enum: ['Message', 'Memory', 'Friendship', 'Group']
    },
    isRead: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 днів
        index: true
    }
}, { timestamps: true });

// Автоматична видалення через 30 днів
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', NotificationSchema);
