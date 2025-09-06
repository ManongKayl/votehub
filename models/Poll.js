const mongoose = require('mongoose');

const optionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Option text is required'],
    trim: true,
    maxlength: [200, 'Option text cannot exceed 200 characters']
  },
  votes: {
    type: Number,
    default: 0,
    min: 0
  },
  voters: [{
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }]
});

const pollSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Poll title is required'],
    trim: true,
    maxlength: [200, 'Poll title cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Poll description cannot exceed 1000 characters']
  },
  options: {
    type: [optionSchema],
    validate: {
      validator: function(options) {
        return options.length >= 2 && options.length <= 10;
      },
      message: 'Poll must have between 2 and 10 options'
    }
  },
  creator: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  allowMultipleVotes: {
    type: Boolean,
    default: false
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(endDate) {
        return !endDate || endDate > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  totalVotes: {
    type: Number,
    default: 0,
    min: 0
  },
  uniqueVoters: {
    type: Number,
    default: 0,
    min: 0
  },
  category: {
    type: String,
    enum: ['general', 'politics', 'entertainment', 'sports', 'technology', 'education', 'business', 'other'],
    default: 'general'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 50
  }]
}, {
  timestamps: true
});

// Indexes for better performance
pollSchema.index({ creator: 1 });
pollSchema.index({ isActive: 1, isPublic: 1 });
pollSchema.index({ category: 1 });
pollSchema.index({ createdAt: -1 });
pollSchema.index({ endDate: 1 });

// Virtual for checking if poll is expired
pollSchema.virtual('isExpired').get(function() {
  return this.endDate && this.endDate < new Date();
});

// Method to check if poll is currently active
pollSchema.methods.isCurrentlyActive = function() {
  const now = new Date();
  return this.isActive && 
         this.startDate <= now && 
         (!this.endDate || this.endDate > now);
};

// Method to get poll results
pollSchema.methods.getResults = function() {
  const totalVotes = this.totalVotes;
  return this.options.map(option => ({
    text: option.text,
    votes: option.votes,
    percentage: totalVotes > 0 ? ((option.votes / totalVotes) * 100).toFixed(2) : 0
  }));
};

module.exports = mongoose.model('Poll', pollSchema);
