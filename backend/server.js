const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

// ── Allowed origins ──
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL,
].filter(Boolean);

// ── Origin checker — Vercel wildcard support ──
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  // ✅ Saare Vercel preview/deployment URLs allow karo
  if (origin.endsWith('.vercel.app')) return true;
  return false;
};

// ── Socket.io ──
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) callback(null, true);
      else callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  }
});

// ── CORS Middleware ──
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked: ${origin}`);
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));

// ── Body Parsers ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Make io accessible to routes ──
app.set('io', io);

// ── Routes ──
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/artists',  require('./routes/artists'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/reviews',  require('./routes/reviews'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/admin', require('./routes/admin'));

// ── Health check ──
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ── Socket.io Events ──
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  socket.on('join-artist-room', (artistId) => socket.join(`artist-${artistId}`));
  socket.on('join-user-room',   (userId)   => socket.join(`user-${userId}`));
  socket.on('disconnect', () => console.log('User disconnected:', socket.id));
});

// ── MongoDB + Server Start ──
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    server.listen(process.env.PORT || 5000, () => {
      console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
      console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')} + *.vercel.app`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });