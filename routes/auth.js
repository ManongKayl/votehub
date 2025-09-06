const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  
  user.password = undefined;
  
  res.status(statusCode).json({
    success: true,
    token,
    data: {
      user
    }
  });
};

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email and password'
      });
    }
    
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }
    
    const newUser = await User.create({
      username,
      email,
      password
    });
    
    createSendToken(newUser, 201, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.correctPassword(password, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password'
      });
    }
    
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }
    
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Get current user
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('createdPolls', 'title totalVotes createdAt')
      .populate('votedPolls.pollId', 'title');
    
    res.status(200).json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Update current user
router.patch('/updateMe', protect, async (req, res) => {
  try {
    const { username, email } = req.body;
    
    if (req.body.password) {
      return res.status(400).json({
        success: false,
        message: 'This route is not for password updates. Please use /updatePassword'
      });
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { username, email },
      {
        new: true,
        runValidators: true
      }
    );
    
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

// Update password
router.patch('/updatePassword', protect, async (req, res) => {
  try {
    const { passwordCurrent, password, passwordConfirm } = req.body;
    
    if (!passwordCurrent || !password || !passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password, new password, and password confirmation'
      });
    }
    
    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        message: 'Password and password confirmation do not match'
      });
    }
    
    const user = await User.findById(req.user.id).select('+password');
    
    if (!(await user.correctPassword(passwordCurrent, user.password))) {
      return res.status(401).json({
        success: false,
        message: 'Your current password is incorrect'
      });
    }
    
    user.password = password;
    await user.save();
    
    createSendToken(user, 200, res);
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
