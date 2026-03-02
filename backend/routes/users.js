const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// ── Get Wishlist ─────────────────────────────────────────────
router.get('/wishlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'wishlist',
      populate: { path: 'artist', select: 'brandName location specialty' }
    });
    res.json(user.wishlist || []);
  } catch (err) {
    console.error('GET wishlist error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── Add to Wishlist ──────────────────────────────────────────
router.post('/wishlist/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    // ✅ Use $addToSet to avoid duplicates — atomic operation, no race condition
    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { wishlist: productId } },
      { new: true }
    );

    const updated = await User.findById(req.user._id).populate({
      path: 'wishlist',
      populate: { path: 'artist', select: 'brandName location specialty' }
    });

    // Socket update
    const io = req.app.get('io');
    if (io) io.to(`user-${req.user._id}`).emit('wishlist-updated', updated.wishlist);

    res.json(updated.wishlist);
  } catch (err) {
    console.error('POST wishlist error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── Remove from Wishlist ─────────────────────────────────────
router.delete('/wishlist/:productId', protect, async (req, res) => {
  try {
    const { productId } = req.params;

    // ✅ Use $pull — atomic, no need to fetch first
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { wishlist: productId } },
      { new: true }
    );

    const updated = await User.findById(req.user._id).populate({
      path: 'wishlist',
      populate: { path: 'artist', select: 'brandName location specialty' }
    });

    const io = req.app.get('io');
    if (io) io.to(`user-${req.user._id}`).emit('wishlist-updated', updated.wishlist);

    res.json(updated.wishlist);
  } catch (err) {
    console.error('DELETE wishlist error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;