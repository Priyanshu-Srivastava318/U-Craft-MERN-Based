const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const User = require('../models/User');
const Artist = require('../models/Artist');
const { generateToken, protect } = require('../middleware/auth');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/emailService');

const withTimeout = (promise, ms, message) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
]);

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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const genericMessage = 'If an account exists, a password reset link has been sent.';

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      console.warn('Password reset requested for unknown email:', normalizedEmail);
      return res.json({ message: genericMessage });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000);

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          resetPasswordToken: hashedToken,
          resetPasswordExpires: resetExpires,
        },
      }
    );

    const clientURL = process.env.CLIENT_URL || req.headers.origin || 'http://localhost:5173';
    const resetUrl = `${clientURL.replace(/\/$/, '')}/reset-password/${resetToken}`;

    try {
      await withTimeout(
        sendPasswordResetEmail({ email: user.email, name: user.name, resetUrl }),
        12000,
        'Email service timed out'
      );
      console.log('Password reset email sent for:', user.email);
    } catch (emailError) {
      console.error('Password reset email error:', emailError.message, 'Link:', resetUrl);
      if (process.env.NODE_ENV === 'production') {
        return res.status(502).json({ message: 'Could not send reset email. Please try again in a few minutes.' });
      }
    }

    const response = { message: genericMessage };
    if (process.env.NODE_ENV !== 'production') response.devResetUrl = resetUrl;
    return res.json(response);
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.json({ message: genericMessage });
  }
});

// POST /api/auth/reset-password/:token
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Reset link is invalid or expired' });

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. You can sign in now.' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reset password' });
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