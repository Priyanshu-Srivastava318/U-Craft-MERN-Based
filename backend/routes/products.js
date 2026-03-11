const express = require('express');
const router  = express.Router();
const Product = require('../models/Product');
const Artist  = require('../models/Artist');
const { protect, artistOnly }     = require('../middleware/auth');
const { cloudinary, uploadProduct } = require('../config/cloudinary');

function runUpload(req, res) {
  return new Promise((resolve, reject) => {
    uploadProduct(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// GET /api/products/artist/my-products
router.get('/artist/my-products', protect, artistOnly, async (req, res) => {
  try {
    const artistProfile = await Artist.findOne({ user: req.user._id });
    if (!artistProfile) return res.status(404).json({ message: 'Artist profile not found' });
    const products = await Product.find({ artist: artistProfile._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id/similar
router.get('/:id/similar', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json([]);

    const similar = await Product.find({
      _id: { $ne: req.params.id },
      category: product.category,
      isActive: true,
    })
      .populate('artist', 'brandName coverImage')
      .limit(4);

    res.json(similar);
  } catch (err) {
    res.status(500).json([]);
  }
});

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, artist, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    if (category)            query.category = category;
    if (artist)              query.artist   = artist;
    if (search)              query.$text    = { $search: search };
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'price-asc')  sortOption = { price: 1 };
    if (sort === 'price-desc') sortOption = { price: -1 };
    if (sort === 'rating')     sortOption = { averageRating: -1 };
    if (sort === 'popular')    sortOption = { sold: -1 };

    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('artist', 'brandName coverImage averageRating user')
        .sort(sortOption).skip(skip).limit(Number(limit)),
      Product.countDocuments(query),
    ]);

    res.json({ products, total, pages: Math.ceil(total / limit), currentPage: Number(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('artist', 'brandName coverImage bio averageRating totalReviews user location specialty');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/products
router.post('/', protect, artistOnly, async (req, res) => {
  try {
    await runUpload(req, res);

    const artistProfile = await Artist.findOne({ user: req.user._id });
    if (!artistProfile) return res.status(404).json({ message: 'Artist profile not found' });

    const uploadedImages = (req.files || []).map(f => f.path);

    const {
      name, description, price, comparePrice,
      category, stock, tags,
    } = req.body;

    let specifications = {};
    try { specifications = JSON.parse(req.body.specifications || '{}'); } catch {}

    const product = await Product.create({
      name,
      description,
      price:        Number(price),
      comparePrice: Number(comparePrice) || 0,
      category,
      stock:        Number(stock),
      tags:         tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      specifications,
      images:       uploadedImages,
      artist:       artistProfile._id,
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', protect, artistOnly, async (req, res) => {
  try {
    await runUpload(req, res);

    const artistProfile = await Artist.findOne({ user: req.user._id });
    if (!artistProfile) return res.status(404).json({ message: 'Artist profile not found' });

    const existing = await Product.findOne({ _id: req.params.id, artist: artistProfile._id });
    if (!existing) return res.status(404).json({ message: 'Product not found or unauthorized' });

    const newImages = (req.files || []).map(f => f.path);

    if (newImages.length > 0 && existing.images?.length > 0) {
      for (const imgUrl of existing.images) {
        try {
          const parts = imgUrl.split('/');
          const filename = parts[parts.length - 1].split('.')[0];
          const folder   = parts[parts.length - 2];
          await cloudinary.uploader.destroy(`${folder}/${filename}`);
        } catch {}
      }
    }

    let specifications = existing.specifications;
    try { specifications = JSON.parse(req.body.specifications || '{}'); } catch {}

    const { name, description, price, comparePrice, category, stock, tags } = req.body;

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price:        Number(price),
        comparePrice: Number(comparePrice) || 0,
        category,
        stock:        Number(stock),
        tags:         tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : existing.tags,
        specifications,
        images:       newImages.length > 0 ? newImages : existing.images,
      },
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', protect, artistOnly, async (req, res) => {
  try {
    const artistProfile = await Artist.findOne({ user: req.user._id });
    if (!artistProfile) return res.status(404).json({ message: 'Artist profile not found' });

    const product = await Product.findOneAndDelete({ _id: req.params.id, artist: artistProfile._id });
    if (!product) return res.status(404).json({ message: 'Product not found or unauthorized' });

    for (const imgUrl of (product.images || [])) {
      try {
        const parts    = imgUrl.split('/');
        const filename = parts[parts.length - 1].split('.')[0];
        const folder   = parts[parts.length - 2];
        await cloudinary.uploader.destroy(`${folder}/${filename}`);
      } catch {}
    }

    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;