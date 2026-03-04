# U·Craft — Artisanal Marketplace

> A marketplace for handcrafted goods — built to connect independent artists with buyers who give a damn about what they own.

🔗 **Live:** [u-craft-mern-based.vercel.app](https://u-craft-mern-based.vercel.app)

---

## Why I built this

Most e-commerce platforms treat handmade products the same as factory goods. I wanted to build something where the artist *is* the brand — their story, their craft, their dashboard.

This started as a side project to learn full-stack development. Ended up being the most complete thing I've shipped.

---

## What it does

Two types of users — **buyers** and **artists** — with completely different experiences.

**Buyers** can browse, search, filter by category/price, wishlist products, checkout with COD or Razorpay, and track their orders through a live progress bar. If an artist updates the order status, the buyer sees it in realtime — no page refresh needed.

**Artists** get a full dashboard — add products with multiple images, track incoming orders, update delivery status, see revenue/ratings/stock alerts at a glance. When a new order comes in, they get a realtime notification on the dashboard.

---

## Tech

```
Frontend   React 18 + Vite + Tailwind CSS
Backend    Node.js + Express + MongoDB
Realtime   Socket.io
Auth       JWT (30-day tokens, role-based)
Payments   Razorpay
Images     Cloudinary
Email      Resend
Deploy     Vercel (frontend) + Render (backend)
```

---

## Features worth mentioning

- **Realtime everything** — cart updates, order notifications, status changes via Socket.io
- **Role-based auth** — artists and buyers have completely separate flows and protected routes
- **Razorpay integration** — with signature verification on the backend (not just frontend)
- **Search with debounce** — MongoDB text index + 400ms debounce so it doesn't hammer the API on every keystroke
- **Artist dashboard** — live stats, product management, order pipeline
- **Email notifications** — order placed, status updates, welcome emails via Resend

---

## Running locally

```bash
# Clone
git clone https://github.com/Priyanshu-Srivastava318/U-Craft-MERN-Based.git
cd U-Craft-MERN-Based

# Backend
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

**Required env vars:**
```
MONGO_URI=
JWT_SECRET=
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RESEND_API_KEY=
```

---

## Folder structure

```
├── backend/
│   ├── models/       User, Artist, Product, Order, Cart, Review
│   ├── routes/       auth, products, orders, cart, artists, users, reviews
│   ├── utils/        emailService.js
│   ├── middleware/   auth.js (JWT + role guards)
│   └── server.js     Express + Socket.io setup
│
└── frontend/src/
    ├── pages/        Home, Shop, ProductDetail, Checkout, MyOrders,
    │                 Wishlist, ArtistDashboard, ArtistProfile ...
    ├── components/   Navbar, CartDrawer, ProductCard, StarRating ...
    ├── context/      AuthContext, CartContext
    └── utils/        api.js (Axios instance)
```

---

*Built by [Priyanshu Srivastava](https://www.linkedin.com/in/priyanshu-srivastava-dev/)*