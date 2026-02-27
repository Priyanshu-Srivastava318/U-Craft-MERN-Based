const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const Artist = require('../models/Artist');
const { protect } = require('../middleware/auth');

// Add review
router.post('/', protect, async (req, res) => {
  try {
    const { productId, artistId, rating, comment, orderId } = req.body;

    const existing = await Review.findOne({ user: req.user._id, product: productId });
    if (existing) return res.status(400).json({ message: 'Already reviewed this product' });

    const review = await Review.create({
      user: req.user._id,
      product: productId,
      artist: artistId,
      rating,
      comment,
      order: orderId
    });

    // Update product rating
    if (productId) {
      const reviews = await Review.find({ product: productId });
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await Product.findByIdAndUpdate(productId, { averageRating: avg.toFixed(1), totalReviews: reviews.length });
    }

    // Update artist rating
    if (artistId) {
      const reviews = await Review.find({ artist: artistId });
      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
      await Artist.findByIdAndUpdate(artistId, { averageRating: avg.toFixed(1), totalReviews: reviews.length });
    }

    await review.populate('user', 'name avatar');
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get reviews for an artist
router.get('/artist/:artistId', async (req, res) => {
  try {
    const reviews = await Review.find({ artist: req.params.artistId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
