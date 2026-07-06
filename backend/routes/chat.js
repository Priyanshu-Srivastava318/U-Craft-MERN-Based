const express = require('express');
const router = express.Router();
const { StreamChat } = require('stream-chat');
const { protect } = require('../middleware/auth');
const Artist = require('../models/Artist');
const User = require('../models/User');

const serverClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);

// GET /api/chat/token — Stream token generate karo
router.get('/token', protect, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const user = await User.findById(userId);

    // ✅ Stream pe user upsert karo
    await serverClient.upsertUser({
      id: userId,
      name: user.name,
      role: req.user.role,
    });

    const token = serverClient.createToken(userId);
    res.json({
      token,
      userId,
      userName: user.name,
      apiKey: process.env.STREAM_API_KEY,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/chat/channel — buyer-artist channel create karo
router.post('/channel', protect, async (req, res) => {
  try {
    const { artistId } = req.body; // Artist._id (not User._id)
    const buyerId = req.user._id.toString();

    // Artist ka User ID dhundo
    const artistDoc = await Artist.findById(artistId).populate('user', 'name email');
    if (!artistDoc) return res.status(404).json({ message: 'Artist not found' });

    const artistUserId = artistDoc.user._id.toString();

    // Dono ko Stream pe upsert karo
    await serverClient.upsertUsers([
      { id: buyerId, name: req.user.name },
      { id: artistUserId, name: artistDoc.user.name || artistDoc.brandName },
    ]);

    // Unique channel ID — buyer + artist combination
    const channelId = `ucraft-${[buyerId, artistUserId].sort().join('-')}`;

    const channel = serverClient.channel('messaging', channelId, {
      members: [buyerId, artistUserId],
      created_by_id: buyerId,
      name: `Chat with ${artistDoc.brandName}`,
    });

    await channel.create();

    const io = req.app.get('io');
    io?.to('artist-' + artistDoc._id.toString()).emit('new-chat', {
      channelId,
      buyerId,
      buyerName: req.user.name,
      artistId: artistDoc._id,
    });

    res.json({
      channelId,
      artistName: artistDoc.brandName,
      artistUserId,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

