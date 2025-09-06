const express = require('express');
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Cast a vote
router.post('/', protect, async (req, res) => {
  try {
    const { pollId, optionIndex } = req.body;

    if (!pollId || optionIndex === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Poll ID and option index are required'
      });
    }

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    if (!poll.isCurrentlyActive()) {
      return res.status(400).json({
        success: false,
        message: 'This poll is not currently active'
      });
    }

    if (optionIndex < 0 || optionIndex >= poll.options.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid option index'
      });
    }

    // Check if user has already voted
    const existingVote = await Vote.findOne({ poll: pollId, user: req.user.id });
    if (existingVote && !poll.allowMultipleVotes) {
      return res.status(400).json({
        success: false,
        message: 'You have already voted on this poll'
      });
    }

    // Create the vote
    const vote = await Vote.create({
      poll: pollId,
      user: req.user.id,
      optionIndex,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || ''
    });

    // Update poll statistics
    poll.options[optionIndex].votes += 1;
    poll.options[optionIndex].voters.push({
      userId: req.user.id,
      votedAt: new Date()
    });
    poll.totalVotes += 1;

    // Update unique voters count if this is the user's first vote on this poll
    if (!existingVote) {
      poll.uniqueVoters += 1;
      
      // Add to user's voted polls
      await User.findByIdAndUpdate(req.user.id, {
        $push: {
          votedPolls: {
            pollId: pollId,
            votedAt: new Date()
          }
        }
      });
    }

    await poll.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      const updatedResults = poll.getResults();
      io.to(`poll-${pollId}`).emit('voteUpdate', {
        pollId,
        results: updatedResults,
        totalVotes: poll.totalVotes,
        uniqueVoters: poll.uniqueVoters
      });
    }

    res.status(201).json({
      success: true,
      data: {
        vote,
        pollResults: poll.getResults()
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get user's votes
router.get('/my-votes', protect, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const votes = await Vote.find({ user: req.user.id })
      .populate('poll', 'title options totalVotes createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Vote.countDocuments({ user: req.user.id });

    const votesWithResults = votes.map(vote => {
      const voteObj = vote.toObject();
      if (vote.poll) {
        voteObj.selectedOption = vote.poll.options[vote.optionIndex];
        voteObj.poll.results = vote.poll.options.map((option, index) => ({
          text: option.text,
          votes: option.votes,
          percentage: vote.poll.totalVotes > 0 ? 
            ((option.votes / vote.poll.totalVotes) * 100).toFixed(2) : 0,
          isSelected: index === vote.optionIndex
        }));
      }
      return voteObj;
    });

    res.status(200).json({
      success: true,
      data: {
        votes: votesWithResults,
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

// Get votes for a specific poll (admin/creator only)
router.get('/poll/:pollId', protect, async (req, res) => {
  try {
    const { pollId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Poll not found'
      });
    }

    // Check if user has permission to view votes
    if (poll.creator.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only view votes for your own polls'
      });
    }

    const votes = await Vote.find({ poll: pollId })
      .populate('user', 'username email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Vote.countDocuments({ poll: pollId });

    const votesWithOptions = votes.map(vote => {
      const voteObj = vote.toObject();
      voteObj.selectedOption = poll.options[vote.optionIndex];
      return voteObj;
    });

    res.status(200).json({
      success: true,
      data: {
        votes: votesWithOptions,
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

// Delete a vote (user can delete their own vote if poll allows)
router.delete('/:voteId', protect, async (req, res) => {
  try {
    const vote = await Vote.findById(req.params.voteId);
    
    if (!vote) {
      return res.status(404).json({
        success: false,
        message: 'Vote not found'
      });
    }

    const poll = await Poll.findById(vote.poll);
    if (!poll) {
      return res.status(404).json({
        success: false,
        message: 'Associated poll not found'
      });
    }

    // Check permissions
    if (vote.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own votes'
      });
    }

    // Check if poll is still active (can't delete votes from closed polls)
    if (!poll.isCurrentlyActive() && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete votes from inactive polls'
      });
    }

    // Update poll statistics
    poll.options[vote.optionIndex].votes -= 1;
    poll.options[vote.optionIndex].voters = poll.options[vote.optionIndex].voters.filter(
      voter => voter.userId.toString() !== vote.user.toString()
    );
    poll.totalVotes -= 1;

    // Check if this was the user's only vote on this poll
    const userOtherVotes = await Vote.countDocuments({
      poll: vote.poll,
      user: vote.user,
      _id: { $ne: vote._id }
    });

    if (userOtherVotes === 0) {
      poll.uniqueVoters -= 1;
      
      // Remove from user's voted polls
      await User.findByIdAndUpdate(vote.user, {
        $pull: {
          votedPolls: { pollId: vote.poll }
        }
      });
    }

    await poll.save();
    await Vote.findByIdAndDelete(req.params.voteId);

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      const updatedResults = poll.getResults();
      io.to(`poll-${vote.poll}`).emit('voteUpdate', {
        pollId: vote.poll,
        results: updatedResults,
        totalVotes: poll.totalVotes,
        uniqueVoters: poll.uniqueVoters
      });
    }

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

module.exports = router;
