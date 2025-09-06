const express = require('express');
const Poll = require('../models/Poll');
const User = require('../models/User');
const Vote = require('../models/Vote');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);
router.use(restrictTo('admin'));

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPolls = await Poll.countDocuments();
    const totalVotes = await Vote.countDocuments();
    const activePolls = await Poll.countDocuments({ 
      isActive: true,
      $or: [
        { endDate: { $exists: false } },
        { endDate: { $gt: new Date() } }
      ]
    });

    // Recent activity
    const recentPolls = await Poll.find()
      .populate('creator', 'username')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('username email createdAt');

    // Popular polls
    const popularPolls = await Poll.find({ isPublic: true })
      .sort({ totalVotes: -1 })
      .limit(5)
      .populate('creator', 'username');

    // Category statistics
    const categoryStats = await Poll.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          totalUsers,
          totalPolls,
          totalVotes,
          activePolls
        },
        recentActivity: {
          polls: recentPolls,
          users: recentUsers
        },
        popularPolls,
        categoryStats
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.isActive = status === 'active';
    }

    const users = await User.find(query)
      .select('username email role isActive createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
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

// Get all polls (admin view)
router.get('/polls', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, category } = req.query;
    
    const query = {};
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }
    if (category && category !== 'all') {
      query.category = category;
    }

    const polls = await Poll.find(query)
      .populate('creator', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

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

// Update user status
router.patch('/users/:id', async (req, res) => {
  try {
    const { isActive, role } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updates = {};
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (role && ['user', 'admin'].includes(role)) updates.role = role;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('username email role isActive createdAt');

    res.status(200).json({
      success: true,
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete user's polls and votes
    await Poll.deleteMany({ creator: req.params.id });
    await Vote.deleteMany({ user: req.params.id });
    await User.findByIdAndDelete(req.params.id);

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

// Update poll status
router.patch('/polls/:id', async (req, res) => {
  try {
    const { isActive, isPublic } = req.body;
    
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    const updates = {};
    if (typeof isActive === 'boolean') updates.isActive = isActive;
    if (typeof isPublic === 'boolean') updates.isPublic = isPublic;

    const updatedPoll = await Poll.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('creator', 'username email');

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
router.delete('/polls/:id', async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Delete associated votes
    await Vote.deleteMany({ poll: req.params.id });
    
    // Remove from creator's created polls
    await User.findByIdAndUpdate(poll.creator, {
      $pull: { createdPolls: req.params.id }
    });

    await Poll.findByIdAndDelete(req.params.id);

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

// Get system analytics
router.get('/analytics', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    let dateFilter;
    const now = new Date();
    
    switch (period) {
      case '24h':
        dateFilter = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        dateFilter = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        dateFilter = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        dateFilter = new Date(now - 7 * 24 * 60 * 60 * 1000);
    }

    // User registration over time
    const userRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Poll creation over time
    const pollCreations = await Poll.aggregate([
      { $match: { createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Voting activity over time
    const votingActivity = await Vote.aggregate([
      { $match: { createdAt: { $gte: dateFilter } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        userRegistrations,
        pollCreations,
        votingActivity,
        period
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
