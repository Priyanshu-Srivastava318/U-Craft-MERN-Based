const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// ── Get Wishlist ─────────────────────────────────────────────
router.get('/wishlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist');
    res.json(user.wishlist || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Add to Wishlist ──────────────────────────────────────────
router.post('/wishlist/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.wishlist) user.wishlist = [];

    if (!user.wishlist.includes(req.params.productId)) {
      user.wishlist.push(req.params.productId);
      await user.save();
    }

    const updated = await User.findById(req.user._id).populate('wishlist');

    // Socket update
    const io = req.app.get('io');
    if (io) io.to(`user-${req.user._id}`).emit('wishlist-updated', updated.wishlist);

    res.json(updated.wishlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Remove from Wishlist ─────────────────────────────────────
router.delete('/wishlist/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.wishlist = (user.wishlist || []).filter(
      id => id.toString() !== req.params.productId
    );
    await user.save();

    const updated = await User.findById(req.user._id).populate('wishlist');

    const io = req.app.get('io');
    if (io) io.to(`user-${req.user._id}`).emit('wishlist-updated', updated.wishlist);

    res.json(updated.wishlist);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;