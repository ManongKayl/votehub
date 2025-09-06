const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  votedPolls: [{
    pollId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Poll'
    },
    votedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdPolls: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Poll'
  }]
}, {
  timestamps: true
});

// Index for better performance
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Instance method to check if user has voted on a poll
userSchema.methods.hasVotedOnPoll = function(pollId) {
  return this.votedPolls.some(vote => vote.pollId.toString() === pollId.toString());
};

module.exports = mongoose.model('User', userSchema);
