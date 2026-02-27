const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  brandName: { type: String, required: true, trim: true },
  bio: { type: String, default: '', maxlength: 1000 },
  specialty: { type: String, default: '' },
  location: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  gallery: [{ type: String }],
  socialLinks: {
    instagram: String,
    website: String,
    twitter: String
  },
  totalSales: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Artist', artistSchema);
