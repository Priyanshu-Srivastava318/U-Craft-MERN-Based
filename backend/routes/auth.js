const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Artist = require('../models/Artist');
const { generateToken, protect } = require('../middleware/auth');
const { sendWelcomeEmail } = require('../utils/emailService');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, brandName, specialty, location, bio } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });

    const user = await User.create({ name, email, password, role: role || 'user' });

    if (role === 'artist') {
      await Artist.create({
        user:      user._id,
        brandName: brandName || name,
        specialty: specialty || '',
        location:  location  || '',
        bio:       bio       || '',
      });
    }

    const token = generateToken(user._id);

    // ✅ Fire and forget — response pe block nahi karta
    sendWelcomeEmail({ email: user.email, name: user.name, role: user.role }).catch(() => {});

    res.status(201).json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = generateToken(user._id);
    res.json({
      token,
      user: { _id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let artistProfile = null;
    if (user.role === 'artist') {
      artistProfile = await Artist.findOne({ user: user._id });
    }
    res.json({ user, artistProfile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/auth/profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, address, avatar } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address, avatar },
      { new: true }
    ).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;