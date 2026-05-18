const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      default: '',
    },
    place: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '#F5811F',
    },
    entityType: {
      type: String,
      enum: ['Friendship', 'Group'],
      required: true,
    },
    entity: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'entityType',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

EventSchema.index({ date: 1 });
EventSchema.index({ entity: 1 });

module.exports = mongoose.model('Event', EventSchema);
