const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    senderId : {
        type: mongoose.Schema.Types.ObjectId, ref: "User",
        required: true
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId, ref: "User",
        required: false
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId, ref: "Group",
        required: false
    },
    text : {
        type: String,
        required: false
    },
    imageUrl: {
        type: String,
        required: false
    },
    isEdited: {
        type: Boolean,
        default: false
    }
},{ timestamps: true });

module.exports = mongoose.model('Message', messageSchema);