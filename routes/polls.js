const express = require('express');
const Poll = require('../models/Poll');
const User = require('../models/User');
const { protect, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get all polls (public)
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      status = 'active'
    } = req.query;

    const query = { isPublic: true };
    
    if (status === 'active') {
      query.isActive = true;
      query.$or = [
        { endDate: { $exists: false } },
        { endDate: { $gt: new Date() } }
      ];
    }
    
    if (category && category !== 'all') {
      query.category = category;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const polls = await Poll.find(query)
      .populate('creator', 'username')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Poll.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        polls,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get single poll
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('creator', 'username email');

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    if (!poll.isPublic && (!req.user || poll.creator._id.toString() !== req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'This poll is private'
      });
    }

    const pollData = poll.toObject();
    pollData.results = poll.getResults();
    pollData.hasVoted = req.user ? req.user.hasVotedOnPoll(poll._id) : false;
    pollData.isExpired = poll.isExpired;
    pollData.isCurrentlyActive = poll.isCurrentlyActive();

    res.status(200).json({
      success: true,
      data: {
        poll: pollData
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Create new poll
router.post('/', protect, async (req, res) => {
  try {
    const {
      title,
      description,
      options,
      isPublic = true,
      allowMultipleVotes = false,
      endDate,
      category = 'general',
      tags = []
    } = req.body;

    if (!title || !options || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Poll must have a title and at least 2 options'
      });
    }

    const pollOptions = options.map(option => ({
      text: typeof option === 'string' ? option : option.text,
      votes: 0,
      voters: []
    }));

    const newPoll = await Poll.create({
      title,
      description,
      options: pollOptions,
      creator: req.user.id,
      isPublic,
      allowMultipleVotes,
      endDate: endDate ? new Date(endDate) : undefined,
      category,
      tags
    });

    await User.findByIdAndUpdate(req.user.id, {
      $push: { createdPolls: newPoll._id }
    });

    const populatedPoll = await Poll.findById(newPoll._id)
      .populate('creator', 'username');

    res.status(201).json({
      success: true,
      data: {
        poll: populatedPoll
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update poll
router.patch('/:id', protect, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    if (poll.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own polls'
      });
    }

    if (poll.totalVotes > 0 && (req.body.options || req.body.allowMultipleVotes)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify options or voting rules after votes have been cast'
      });
    }

    const allowedUpdates = ['title', 'description', 'isPublic', 'endDate', 'category', 'tags', 'isActive'];
    const updates = {};
    
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedPoll = await Poll.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('creator', 'username');

    res.status(200).json({
      success: true,
      data: {
        poll: updatedPoll
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete poll
router.delete('/:id', protect, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    if (poll.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own polls'
      });
    }

    await Poll.findByIdAndDelete(req.params.id);

    await User.findByIdAndUpdate(poll.creator, {
      $pull: { createdPolls: req.params.id }
    });

    res.status(204).json({
      success: true,
      data: null
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get user's polls
router.get('/user/my-polls', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const polls = await Poll.find({ creator: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Poll.countDocuments({ creator: req.user.id });

    res.status(200).json({
      success: true,
      data: {
        polls,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
