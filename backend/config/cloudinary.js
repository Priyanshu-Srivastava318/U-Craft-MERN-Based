// backend/config/cloudinary.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for product images
const productStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:         'ucraft/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
  },
});

// Storage for artist cover images
const coverStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:          'ucraft/covers',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation:  [{ width: 1920, height: 600, crop: 'fill', quality: 'auto' }],
  },
});

const uploadProduct = multer({
  storage: productStorage,
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5MB per file
}).array('images', 4); // max 4 images

const uploadCover = multer({
  storage: coverStorage,
  limits:  { fileSize: 5 * 1024 * 1024 },
}).single('cover');

module.exports = { cloudinary, uploadProduct, uploadCover };