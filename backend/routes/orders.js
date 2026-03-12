const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Artist = require('../models/Artist');
const User = require('../models/User');
const { protect, artistOnly } = require('../middleware/auth');
const crypto = require('crypto');
const {
  sendOrderPlaced,
  sendOrderStatusUpdate,
  sendNewOrderToArtist,
} = require('../utils/emailService');

let Razorpay;
try { Razorpay = require('razorpay'); } catch {
  console.warn('Razorpay not installed');
}

const getRazorpayInstance = () => {
  if (!Razorpay) throw new Error('Razorpay not installed');
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
};

// ── NAMED ROUTES FIRST ──────────────────────────────────────

router.get('/my-orders', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/artist-orders', protect, artistOnly, async (req, res) => {
  try {
    const artist = await Artist.findOne({ user: req.user._id });
    if (!artist) return res.status(404).json({ message: 'Artist profile not found' });
    const orders = await Order.find({ 'items.artist': artist._id })
      .sort({ createdAt: -1 })
      .populate('user', 'name email');
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/razorpay/create', protect, async (req, res) => {
  try {
    const { amount } = req.body;
    const instance = getRazorpayInstance();
    const order = await instance.orders.create({ amount: Math.round(amount * 100), currency: 'INR', receipt: `rcpt_${Date.now()}` });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/razorpay/verify', protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;
    const expectedSig = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    if (expectedSig !== razorpay_signature) return res.status(400).json({ message: 'Payment verification failed' });

    const order = await Order.findByIdAndUpdate(orderId,
      { paymentStatus: 'paid', paymentId: razorpay_payment_id, orderStatus: 'confirmed' },
      { new: true }
    );

    const io = req.app.get('io');
    if (io && order) {
      const artistIds = [...new Set(order.items.map(i => i.artist?.toString()).filter(Boolean))];
      artistIds.forEach(id => io.to(`artist-${id}`).emit('new-order', order));
      io.to(`user-${order.user}`).emit('order-confirmed', order);
    }

    User.findById(order.user).then(buyer => {
      if (buyer) sendOrderStatusUpdate({ buyerEmail: buyer.email, buyerName: buyer.name, order, newStatus: 'confirmed' }).catch(() => {});
    }).catch(() => {});

    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── REFUND REQUEST — user submits ───────────────────────────
router.post('/:id/refund-request', protect, async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ message: 'Reason is required' });

    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.refundRequest?.status === 'pending')
      return res.status(400).json({ message: 'Refund request already submitted' });

    if (order.refundRequest?.status === 'approved')
      return res.status(400).json({ message: 'Refund already approved' });

    if (order.orderStatus === 'delivered')
      return res.status(400).json({ message: 'Delivered orders cannot be cancelled. Contact support.' });

    if (order.orderStatus === 'cancelled')
      return res.status(400).json({ message: 'Order is already cancelled' });

    order.refundRequest = {
      status: 'pending',
      reason,
      requestedAt: new Date(),
      adminNote: '',
    };
    await order.save();

    res.json({ success: true, order });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ── GENERIC ROUTES ───────────────────────────────────────────

router.post('/', protect, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod, notes } = req.body;

    const cart = await Cart.findOne({ user: req.user._id })
      .populate({ path: 'items.product', populate: { path: 'artist', select: '_id brandName' } });

    if (!cart || !cart.items?.length)
      return res.status(400).json({ message: 'Cart is empty' });

    const items = cart.items.map(item => ({
      product:  item.product._id,
      name:     item.product.name,
      image:    item.product.images?.[0] || '',
      price:    item.product.price,
      quantity: item.quantity,
      artist:   item.product.artist?._id,
    }));

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = subtotal > 999 ? 0 : 99;
    const total    = subtotal + shipping;

    const order = await Order.create({
      user: req.user._id, items, shippingAddress, paymentMethod,
      paymentStatus: 'pending', orderStatus: 'placed',
      subtotal, shipping, total, notes,
      orderNumber: `UC${Date.now()}`,
    });

    if (paymentMethod === 'COD') {
      const io = req.app.get('io');
      const artistIds = [...new Set(items.map(i => i.artist?.toString()).filter(Boolean))];
      artistIds.forEach(id => { if (io) io.to(`artist-${id}`).emit('new-order', order); });
      if (io) io.to(`user-${req.user._id}`).emit('order-confirmed', order);
    }

    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

    res.status(201).json(order);

    User.findById(req.user._id).then(async buyer => {
      if (!buyer) return;
      sendOrderPlaced({ buyerEmail: buyer.email, buyerName: buyer.name, order }).catch(() => {});
      const uniqueArtistIds = [...new Set(items.map(i => i.artist?.toString()).filter(Boolean))];
      for (const artistId of uniqueArtistIds) {
        Artist.findById(artistId).populate('user', 'name email').then(artistDoc => {
          if (artistDoc?.user?.email) {
            sendNewOrderToArtist({
              artistEmail: artistDoc.user.email,
              artistName:  artistDoc.brandName,
              order,
              buyerName:   buyer.name,
            }).catch(() => {});
          }
        }).catch(() => {});
      }
    }).catch(() => {});

  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.put('/:id/status', protect, artistOnly, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['placed','confirmed','processing','shipped','delivered','cancelled'];
    if (!validStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { orderStatus: status, updatedAt: Date.now() },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const io = req.app.get('io');
    if (io) io.to(`user-${order.user}`).emit('order-status-updated', { orderId: order._id, status, orderNumber: order.orderNumber });

    res.json(order);

    User.findById(order.user).then(buyer => {
      if (buyer) sendOrderStatusUpdate({ buyerEmail: buyer.email, buyerName: buyer.name, order, newStatus: status }).catch(() => {});
    }).catch(() => {});

  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('user', 'name email');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.paymentStatus === 'paid') return res.status(400).json({ message: 'Cannot delete paid order' });
    await order.deleteOne();
    res.json({ message: 'Order removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

module.exports = router;