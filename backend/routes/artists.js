const express = require('express');
const router = express.Router();
const Artist = require('../models/Artist');
const Product = require('../models/Product');
const Review = require('../models/Review');
const { protect, artistOnly } = require('../middleware/auth');
const { cloudinary, uploadCover } = require('../config/cloudinary');

function runCoverUpload(req, res) {
  return new Promise((resolve, reject) => {
    uploadCover(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Get all artists
router.get('/', async (req, res) => {
  try {
    const artists = await Artist.find().populate('user', 'name email avatar').sort({ totalSales: -1 });
    res.json(artists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ⚠️ IMPORTANT: named routes BEFORE /:id

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
      outOfStock,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update artist profile (with optional cover image)
router.put('/profile', protect, artistOnly, async (req, res) => {
  try {
    await runCoverUpload(req, res);

    let socialLinks = {};
    try { socialLinks = JSON.parse(req.body.socialLinks || '{}'); } catch {}

    const updateData = {
      brandName: req.body.brandName,
      bio:       req.body.bio,
      specialty: req.body.specialty,
      location:  req.body.location,
      socialLinks,
    };

    // If new cover uploaded, add it
    if (req.file?.path) {
      // Delete old cover from cloudinary if exists
      const existing = await Artist.findOne({ user: req.user._id });
      if (existing?.coverImage) {
        try {
          const parts    = existing.coverImage.split('/');
          const filename = parts[parts.length - 1].split('.')[0];
          const folder   = parts[parts.length - 2];
          await cloudinary.uploader.destroy(`${folder}/${filename}`);
        } catch {}
      }
      updateData.coverImage = req.file.path;
    }

    const artist = await Artist.findOneAndUpdate(
      { user: req.user._id },
      updateData,
      { new: true }
    ).populate('user', 'name avatar email');

    res.json(artist);
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

// Get artist profile by ID
router.get('/:id', async (req, res) => {
  try {
    const artist = await Artist.findById(req.params.id).populate('user', 'name avatar email');
    if (!artist) return res.status(404).json({ message: 'Artist not found' });

    const products = await Product.find({ artist: artist._id, isActive: true });
    const reviews  = await Review.find({ artist: artist._id })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ artist, products, reviews });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;