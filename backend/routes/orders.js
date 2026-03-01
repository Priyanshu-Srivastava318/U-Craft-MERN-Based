const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { protect, artistOnly } = require('../middleware/auth');
const crypto = require('crypto');

// ── Razorpay setup ──────────────────────────────────────────
let Razorpay;
try {
  Razorpay = require('razorpay');
} catch {
  console.warn('Razorpay not installed — run: npm install razorpay');
}

const getRazorpayInstance = () => {
  if (!Razorpay) throw new Error('Razorpay not installed');
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

// ── Create Razorpay Order ───────────────────────────────────
router.post('/razorpay/create', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const instance = getRazorpayInstance();
    const order = await instance.orders.create({
      amount: Math.round(amount * 100), // paise mein
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
    });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Verify Razorpay Payment ─────────────────────────────────
router.post('/razorpay/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    const expectedSig = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSig !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed' });
    }

    // Mark order as paid
    const order = await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      paymentId: razorpay_payment_id,
      orderStatus: 'confirmed',
    }, { new: true });

    // Notify artist via socket
    const io = req.app.get('io');
    if (io && order) {
      io.to(`artist-${order.artist}`).emit('new-order', order);
    }

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Create Order ────────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, notes } = req.body;

    const cart = await Cart.findOne({ user: req.user._id })
      .populate({ path: 'items.product', populate: { path: 'artist', select: '_id brandName' } });

    if (!cart || !cart.items?.length) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Build order items
    const items = cart.items.map(item => ({
      product: item.product._id,
      name: item.product.name,
      image: item.product.images?.[0] || '',
      price: item.product.price,
      quantity: item.quantity,
      artist: item.product.artist?._id,
    }));

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal > 999 ? 0 : 99;
    const total = subtotal + shipping;

    const order = new Order({
      user: req.user._id,
      items,
      shippingAddress,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'pending' : 'pending',
      orderStatus: paymentMethod === 'COD' ? 'placed' : 'placed',
      subtotal,
      shipping,
      total,
      notes,
      orderNumber: `UC${Date.now()}`,
    });

    await order.save();

    // Notify artist if COD (confirmed immediately)
    if (paymentMethod === 'COD') {
      const io = req.app.get('io');
      const artistIds = [...new Set(items.map(i => i.artist?.toString()).filter(Boolean))];
      artistIds.forEach(artistId => {
        if (io) io.to(`artist-${artistId}`).emit('new-order', order);
      });

      // Notify user
      if (io) io.to(`user-${req.user._id}`).emit('order-confirmed', order);
    }

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Delete Pending Order (cancelled payment) ────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentStatus === 'paid') return res.status(400).json({ message: 'Cannot delete paid order' });
    await order.deleteOne();
    res.json({ message: 'Order removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── My Orders ───────────────────────────────────────────────
router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Update Order Status (Artist) ────────────────────────────
router.put('/:id/status', protect, artistOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, { orderStatus: status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    // Realtime update to buyer
    const io = req.app.get('io');
    if (io) {
      io.to(`user-${order.user}`).emit('order-status-updated', {
        orderId: order._id,
        status,
        orderNumber: order.orderNumber,
      });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Artist Orders ───────────────────────────────────────────
router.get('/artist-orders', protect, artistOnly, async (req, res) => {
  try {
    const orders = await Order.find({ 'items.artist': req.user._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;