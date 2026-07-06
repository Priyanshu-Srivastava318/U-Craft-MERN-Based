const express = require('express');
const router = express.Router();
const { StreamChat } = require('stream-chat');
const { protect } = require('../middleware/auth');
const Artist = require('../models/Artist');
const User = require('../models/User');

const getStreamConfig = () => ({
  apiKey: process.env.STREAM_API_KEY || process.env.STREAM_CHAT_API_KEY,
  apiSecret: process.env.STREAM_API_SECRET || process.env.STREAM_CHAT_API_SECRET,
});

let serverClient = null;
function getServerClient() {
  const { apiKey, apiSecret } = getStreamConfig();
  if (!apiKey || !apiSecret) return null;
  if (!serverClient) serverClient = StreamChat.getInstance(apiKey, apiSecret);
  return serverClient;
}

// GET /api/chat/token — Stream token generate karo
router.get('/token', protect, async (req, res) => {
  try {
    const client = getServerClient();
    const { apiKey } = getStreamConfig();
    if (!client) {
      return res.status(503).json({ message: 'Chat service is not configured. Add STREAM_API_KEY and STREAM_API_SECRET on the server.' });
    }

    const userId = req.user._id.toString();
    const user = await User.findById(userId);

    // ✅ Stream pe user upsert karo
    await client.upsertUser({
      id: userId,
      name: user.name,
      ucraftRole: req.user.role,
    });

    const token = client.createToken(userId);
    res.json({
      token,
      userId,
      userName: user.name,
      apiKey,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/chat/channel — buyer-artist channel create karo
router.post('/channel', protect, async (req, res) => {
  try {
    const client = getServerClient();
    if (!client) {
      return res.status(503).json({ message: 'Chat service is not configured. Add STREAM_API_KEY and STREAM_API_SECRET on the server.' });
    }

    const { artistId } = req.body; // Artist._id (not User._id)
    const buyerId = req.user._id.toString();

    // Artist ka User ID dhundo
    const artistDoc = await Artist.findById(artistId).populate('user', 'name email');
    if (!artistDoc) return res.status(404).json({ message: 'Artist not found' });

    const artistUserId = artistDoc.user._id.toString();

    // Dono ko Stream pe upsert karo
    await client.upsertUsers([
      { id: buyerId, name: req.user.name, ucraftRole: req.user.role },
      { id: artistUserId, name: artistDoc.user.name || artistDoc.brandName, ucraftRole: 'artist' },
    ]);

    // Unique channel ID — buyer + artist combination
    const channelId = `ucraft-${[buyerId, artistUserId].sort().join('-')}`;

    const channel = client.channel('messaging', channelId, {
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

