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
    tags: [{
        type: String,
        trim: true,
        lowercase: true
    }],
    entityType: {
        type: String,
        enum: ['Friendship', 'Group'],
        required: true
    },
    entity: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'entityType'
    },
    comments: [
        {
            text: { type: String, required: true },
            author: { type: String, default: "Анонім" },
            createdAt: { type: Date, default: Date.now }
        }
    ]
},
    { timestamps: true }
);

// Index для пошуку по тегам
MemorySchema.index({ tags: 1 });
MemorySchema.index({ title: "text", description: "text", place: "text" });

module.exports = mongoose.model('Memory', MemorySchema);