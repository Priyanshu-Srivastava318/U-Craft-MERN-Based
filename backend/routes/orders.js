const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Artist = require('../models/Artist');
const { protect, artistOnly } = require('../middleware/auth');

// Place order
router.post('/', protect, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, notes } = req.body;

    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Cart is empty' });

    let subtotal = 0;
    const orderItems = [];

    for (const item of cart.items) {
      if (!item.product || !item.product.isActive) continue;
      if (item.product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${item.product.name}` });
      }

      subtotal += item.product.price * item.quantity;
      orderItems.push({
        product: item.product._id,
        artist: item.product.artist,
        quantity: item.quantity,
        price: item.product.price,
        name: item.product.name,
        image: item.product.images[0] || ''
      });
    }

    const shippingCost = subtotal > 999 ? 0 : 99;
    const total = subtotal + shippingCost;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      subtotal,
      shippingCost,
      total,
      notes
    });

    // Update stock and sold counts
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity, sold: item.quantity }
      });
    }

    // Update artist stats
    const artistUpdates = {};
    for (const item of orderItems) {
      const artistId = item.artist.toString();
      if (!artistUpdates[artistId]) artistUpdates[artistId] = { sales: 0, revenue: 0 };
      artistUpdates[artistId].sales += item.quantity;
      artistUpdates[artistId].revenue += item.price * item.quantity;
    }

    for (const [artistId, stats] of Object.entries(artistUpdates)) {
      await Artist.findByIdAndUpdate(artistId, {
        $inc: { totalSales: stats.sales, totalRevenue: stats.revenue }
      });

      // Notify artist
      const io = req.app.get('io');
      io.to(`artist-${artistId}`).emit('new-order', {
        orderNumber: order.orderNumber,
        items: orderItems.filter(i => i.artist.toString() === artistId),
        total: stats.revenue
      });
    }

    // Clear cart
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    await order.populate('items.product', 'name images');
    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// User orders
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).populate('items.product', 'name images');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Artist orders (orders containing artist's products)
router.get('/artist-orders', protect, artistOnly, async (req, res) => {
  try {
    const artistProfile = await Artist.findOne({ user: req.user._id });
    const orders = await Order.find({ 'items.artist': artistProfile._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone')
      .populate('items.product', 'name images');
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update order status (artist)
router.put('/:id/status', protect, artistOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus: status, updatedAt: Date.now() }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Notify user
    const io = req.app.get('io');
    io.to(`user-${order.user}`).emit('order-updated', { orderId: order._id, status });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single order
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.product', 'name images')
      .populate('items.artist', 'brandName');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
