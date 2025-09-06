const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  poll: {
    type: mongoose.Schema.ObjectId,
    ref: 'Poll',
    required: [true, 'Vote must belong to a poll']
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Vote must belong to a user']
  },
  optionIndex: {
    type: Number,
    required: [true, 'Option index is required'],
    min: 0
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: ''
  },
  isValid: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate votes (unless poll allows multiple votes)
voteSchema.index({ poll: 1, user: 1 });
voteSchema.index({ poll: 1, createdAt: -1 });
voteSchema.index({ user: 1, createdAt: -1 });

// Static method to get vote statistics for a poll
voteSchema.statics.getVoteStats = async function(pollId) {
  const stats = await this.aggregate([
    { $match: { poll: mongoose.Types.ObjectId(pollId), isValid: true } },
    {
      $group: {
        _id: '$optionIndex',
        count: { $sum: 1 },
        voters: { $addToSet: '$user' }
      }
    },
    {
      $project: {
        optionIndex: '$_id',
        votes: '$count',
        uniqueVoters: { $size: '$voters' }
      }
    },
    { $sort: { optionIndex: 1 } }
  ]);
  
  return stats;
};

module.exports = mongoose.model('Vote', voteSchema);
