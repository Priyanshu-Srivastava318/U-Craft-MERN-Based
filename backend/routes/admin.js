const express = require("express");
const router  = express.Router();

// ── Admin Key Auth ────────────────────────────────────────────────────────────
const ADMIN_KEY = process.env.ADMIN_KEY || "ucraft_admin_secret_2025";

router.use((req, res, next) => {
  const key = req.headers["x-admin-key"];
  if (!key || key !== ADMIN_KEY)
    return res.status(401).json({ error: "Unauthorized" });
  next();
});

// ── Models ───────────────────────────────────────────────────────────────────
const User    = require("../models/User");
const Artist  = require("../models/Artist");
const Product = require("../models/Product");
const Order   = require("../models/Order");

// ══════════════════════════════════════════════════════════════════════════════
// STATS
// ══════════════════════════════════════════════════════════════════════════════
router.get("/stats", async (req, res) => {
  try {
    const [
      totalUsers, totalArtists, totalProducts,
      totalOrders, revenueAgg, recentOrders,
      pendingOrders, pendingRefunds,
    ] = await Promise.all([
      User.countDocuments(),
      Artist.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([{ $group: { _id: null, total: { $sum: "$total" } } }]),
      Order.find().sort({ createdAt: -1 }).limit(5).populate("user", "name email"),
      Order.countDocuments({ orderStatus: "placed" }),
      Order.countDocuments({ "refundRequest.status": "pending" }),
    ]);

    res.json({
      totalUsers, totalArtists, totalProducts, totalOrders,
      totalRevenue: revenueAgg[0]?.total || 0,
      recentOrders, pendingOrders, pendingRefunds,
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// USERS
// ══════════════════════════════════════════════════════════════════════════════
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 }).limit(500);
    res.json(users);
  } catch (err) { res.status(500).json({ error: "Failed to fetch users" }); }
});

router.delete("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to delete user" }); }
});

router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "artist"].includes(role))
      return res.status(400).json({ error: "Invalid role" });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    res.json(user);
  } catch (err) { res.status(500).json({ error: "Failed to update role" }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// ARTISTS
// ══════════════════════════════════════════════════════════════════════════════
router.get("/artists", async (req, res) => {
  try {
    const artists = await Artist.find().populate("user", "name email").sort({ createdAt: -1 }).limit(500);
    res.json(artists);
  } catch (err) { res.status(500).json({ error: "Failed to fetch artists" }); }
});

router.delete("/artists/:id", async (req, res) => {
  try {
    await Artist.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to delete artist" }); }
});

router.patch("/artists/:id/verify", async (req, res) => {
  try {
    const artist = await Artist.findByIdAndUpdate(
      req.params.id,
      { isVerified: !req.body.current },
      { new: true }
    ).populate("user", "name email");
    res.json(artist);
  } catch (err) { res.status(500).json({ error: "Failed to update verification" }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// PRODUCTS
// ══════════════════════════════════════════════════════════════════════════════
router.get("/products", async (req, res) => {
  try {
    const products = await Product.find()
      .populate("artist", "brandName")
      .sort({ createdAt: -1 }).limit(500);
    res.json(products);
  } catch (err) { res.status(500).json({ error: "Failed to fetch products" }); }
});

router.delete("/products/:id", async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to delete product" }); }
});

router.patch("/products/:id/feature", async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isFeatured: !req.body.current },
      { new: true }
    ).populate("artist", "brandName");
    res.json(product);
  } catch (err) { res.status(500).json({ error: "Failed to update product" }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// ORDERS
// ══════════════════════════════════════════════════════════════════════════════
router.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 }).limit(500);
    res.json(orders);
  } catch (err) { res.status(500).json({ error: "Failed to fetch orders" }); }
});

router.patch("/orders/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ["placed","confirmed","processing","shipped","delivered","cancelled"];
    if (!valid.includes(status)) return res.status(400).json({ error: "Invalid status" });
    const order = await Order.findByIdAndUpdate(
      req.params.id, { orderStatus: status, updatedAt: Date.now() }, { new: true }
    ).populate("user", "name email");
    res.json(order);
  } catch (err) { res.status(500).json({ error: "Failed to update order" }); }
});

router.delete("/orders/:id", async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: "Failed to delete order" }); }
});

// ══════════════════════════════════════════════════════════════════════════════
// REFUND REQUESTS
// ══════════════════════════════════════════════════════════════════════════════
router.get("/refund-requests", async (req, res) => {
  try {
    const orders = await Order.find({ "refundRequest.status": "pending" })
      .populate("user", "name email")
      .sort({ "refundRequest.requestedAt": -1 });
    res.json(orders);
  } catch (err) { res.status(500).json({ error: "Failed to fetch refund requests" }); }
});

router.patch("/refund-requests/:id/approve", async (req, res) => {
  try {
    const { adminNote } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        "refundRequest.status": "approved",
        "refundRequest.resolvedAt": new Date(),
        "refundRequest.adminNote": adminNote || "Your refund has been approved.",
        orderStatus: "cancelled",
        updatedAt: Date.now(),
      },
      { new: true }
    ).populate("user", "name email");
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) { res.status(500).json({ error: "Failed to approve refund" }); }
});

router.patch("/refund-requests/:id/reject", async (req, res) => {
  try {
    const { adminNote } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        "refundRequest.status": "rejected",
        "refundRequest.resolvedAt": new Date(),
        "refundRequest.adminNote": adminNote || "Your refund request has been rejected.",
        updatedAt: Date.now(),
      },
      { new: true }
    ).populate("user", "name email");
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (err) { res.status(500).json({ error: "Failed to reject refund" }); }
});

module.exports = router;