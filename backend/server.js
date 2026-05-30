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
  'https://u-craft.in',
  'https://www.u-craft.in',
  process.env.CLIENT_URL,
].filter(Boolean);

// ── Origin checker — Vercel wildcard support ──
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
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

// ── Stats Route ──
const Artist  = require('./models/Artist');
const Product = require('./models/Product');

const SITE_URL = 'https://www.u-craft.in';

function slugify(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function productPath(product) {
  return `/product/${slugify(product.name) || 'handmade-product'}-${product._id}`;
}

function artistPath(artist) {
  return `/artist/${slugify(artist.brandName) || 'artisan'}-${artist._id}`;
}

function xmlEscape(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

app.get('/api/stats', async (req, res) => {
  try {
    const [artists, products, categoryData] = await Promise.all([
      Artist.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.distinct('category', { isActive: true }),
    ]);
    res.json({ artists, products, categories: categoryData.length });
  } catch (err) {
    res.status(500).json({ artists: 0, products: 0, categories: 0 });
  }
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const [products, artists] = await Promise.all([
      Product.find({ isActive: true }).select('name updatedAt createdAt').sort({ createdAt: -1 }).limit(5000),
      Artist.find().select('brandName updatedAt createdAt').sort({ createdAt: -1 }).limit(5000),
    ]);

    const staticUrls = [
      { loc: '/', priority: '1.0', changefreq: 'daily' },
      { loc: '/shop', priority: '0.9', changefreq: 'daily' },
      { loc: '/artists', priority: '0.8', changefreq: 'weekly' },
      { loc: '/about', priority: '0.6', changefreq: 'monthly' },
    ];

    const urls = [
      ...staticUrls,
      ...products.map(product => ({
        loc: productPath(product),
        priority: '0.8',
        changefreq: 'weekly',
        lastmod: product.updatedAt || product.createdAt,
      })),
      ...artists.map(artist => ({
        loc: artistPath(artist),
        priority: '0.7',
        changefreq: 'weekly',
        lastmod: artist.updatedAt || artist.createdAt,
      })),
    ];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map(({ loc, priority, changefreq, lastmod }) => {
        const lastmodTag = lastmod ? `\n    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : '';
        return `  <url>\n    <loc>${xmlEscape(`${SITE_URL}${loc}`)}</loc>${lastmodTag}\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
      }).join('\n') +
      `\n</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    res.status(500).send('Unable to generate sitemap');
  }
});

// ── Routes ──
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/artists',  require('./routes/artists'));
app.use('/api/users',    require('./routes/users'));
app.use('/api/reviews',  require('./routes/reviews'));
app.use('/api/chat',     require('./routes/chat'));
app.use('/api/admin',    require('./routes/admin'));

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
