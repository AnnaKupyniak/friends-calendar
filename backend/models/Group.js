const mongoose = require('mongoose');

const GroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a group name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters']
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    avatar: {
      type: String,
      default: 'default-group.png'
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    categories: [
      {
        type: [String], 
        trim: true
      }
    ],
    isPrivate: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

GroupSchema.pre('save', function() {
  if (!this.members.includes(this.owner)) {
    this.members.push(this.owner);
  }
  return;
});

module.exports = mongoose.model('Group', GroupSchema);
