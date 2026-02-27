const express = require('express');
const router = express.Router();
const Artist = require('../models/Artist');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { protect, artistOnly } = require('../middleware/auth');

// Get all artists
router.get('/', async (req, res) => {
  try {
    const artists = await Artist.find().populate('user', 'name email avatar').sort({ totalSales: -1 });
    res.json(artists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get artist profile by ID
router.get('/:id', async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id).populate('user', 'name avatar email');
    if (!artist) return res.status(404).json({ message: 'Artist not found' });

    const products = await Product.find({ artist: artist._id, isActive: true });
    const reviews = await Review.find({ artist: artist._id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ artist, products, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get artist profile by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const artist = await Artist.findOne({ user: req.params.userId }).populate('user', 'name avatar email');
    if (!artist) return res.status(404).json({ message: 'Artist not found' });
    res.json(artist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update artist profile
router.put('/profile/update', protect, artistOnly, async (req, res) => {
  try {
    const { brandName, bio, specialty, location, coverImage, gallery, socialLinks } = req.body;
    const artist = await Artist.findOneAndUpdate(
      { user: req.user._id },
      { brandName, bio, specialty, location, coverImage, gallery, socialLinks },
      { new: true }
    ).populate('user', 'name avatar email');
    res.json(artist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Artist dashboard stats
router.get('/dashboard/stats', protect, artistOnly, async (req, res) => {
  try {
    const artist = await Artist.findOne({ user: req.user._id });
    const products = await Product.find({ artist: artist._id });
    const activeProducts = products.filter(p => p.isActive).length;
    const outOfStock = products.filter(p => p.stock === 0).length;

    res.json({
      totalSales: artist.totalSales,
      totalRevenue: artist.totalRevenue,
      averageRating: artist.averageRating,
      totalReviews: artist.totalReviews,
      totalProducts: products.length,
      activeProducts,
      outOfStock
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
