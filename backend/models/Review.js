const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  artist: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true, maxlength: 500 },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  createdAt: { type: Date, default: Date.now }
});

reviewSchema.index({ user: 1, product: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Review', reviewSchema);
