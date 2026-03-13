const mongoose = require('mongoose');

const MemorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
    },
    imageUrls: [{ 
        type: String,
    }],
    date: {
        type: Date,
        required: true
    },
    place: {
        type: String,
        required: true
    },
    category: {
        type: String
    },
    entityType: {
        type: String,
        enum: ['Friendship', 'Group'],
        required: true
    },
    entity: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'entityType'
    }
},
    { timestamps: true }
);

module.exports = mongoose.model('Memory', MemorySchema);