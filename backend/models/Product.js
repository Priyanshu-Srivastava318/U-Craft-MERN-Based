const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  artist: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist', required: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  comparePrice: { type: Number, default: 0 },
  images: [{ type: String }],
  category: {
    type: String,
    enum: ['Paintings', 'Pottery', 'Jewelry', 'Textiles', 'Woodwork', 'Metalwork', 'Leather', 'Glass', 'Paper', 'Other'],
    required: true
  },
  tags: [{ type: String }],
  specifications: {
    material: String,
    dimensions: String,
    weight: String,
    color: String,
    customizable: { type: Boolean, default: false }
  },
  stock: { type: Number, required: true, default: 1, min: 0 },
  sold: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
