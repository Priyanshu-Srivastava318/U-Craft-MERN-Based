# U-Craft — Artisanal Marketplace

A full-stack MERN e-commerce platform connecting artisans with buyers who value authentic, handcrafted goods.

---

## Tech Stack

- **Backend:** Node.js + Express + MongoDB (Mongoose) + Socket.io
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Auth:** JWT-based authentication
- **Realtime:** Socket.io for cart sync & order notifications

---

## Project Structure

```
ucraft/
├── backend/
│   ├── models/       # User, Artist, Product, Order, Cart, Review
│   ├── routes/       # auth, products, orders, cart, artists, users, reviews
│   ├── middleware/   # JWT auth, role guards
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/    # Home, Shop, Login, Register, ProductDetail,
│       │             # Artists, ArtistProfile, ArtistDashboard,
│       │             # Checkout, MyOrders, Wishlist, Profile, About
│       ├── components/ # Navbar, CartDrawer, ProductCard, Footer, StarRating
│       ├── context/  # AuthContext, CartContext
│       └── utils/    # api.js
└── README.md
```

---

## Setup Instructions

### 1. Clone / Extract project

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env and add your MONGO_URI (your existing MongoDB URL)
npm install
```

### 3. Frontend Setup
```bash
cd frontend
npm install
```

### 4. Environment Variables (backend/.env)
```env
MONGO_URI=your_existing_mongodb_url
JWT_SECRET=any_random_secret_string
PORT=5000
CLIENT_URL=http://localhost:5173
```

> **Note:** A new collection `ucraft_db` will be automatically created in your existing MongoDB when you first run the app.

### 5. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000

---

## Pages & Routes

| Page | URL | Access |
|------|-----|--------|
| Home | `/` | Public |
| Shop | `/shop` | Public |
| Product Detail | `/product/:id` | Public |
| Artists | `/artists` | Public |
| Artist Profile | `/artist/:id` | Public |
| About | `/about` | Public |
| Login | `/login` | Guest |
| Register | `/register` | Guest |
| Checkout | `/checkout` | User only |
| My Orders | `/orders` | User only |
| Wishlist | `/wishlist` | User only |
| Profile | `/profile` | Logged in |
| Artist Dashboard | `/artist/dashboard` | Artist only |

---

## Features

### For Buyers (User Role)
- Browse all products with filters (category, price, sort)
- Search products
- Product detail with image gallery + reviews
- Add to cart (realtime cart via Socket.io)
- Cart drawer with quantity management
- Checkout with shipping address
- Order history with live status tracking progress bar
- Wishlist
- Artist profiles with ratings

### For Artists (Artist Role)
- Full dashboard with stats (sales, revenue, rating, stock alerts)
- Add / Edit / Delete products with multi-image support
- Product specifications (material, dimensions, color, etc.)
- View and manage incoming orders
- Update order status (placed → confirmed → processing → shipped → delivered)
- Realtime new order notifications via Socket.io
- Public profile page visible to all users

### General
- JWT auth with 30-day tokens
- Separate signup flows for User and Artist
- Review & rating system (per product + per artist)
- Free shipping on orders over ₹999
- Responsive design on all screens

---

## API Reference

### Auth
- `POST /api/auth/register` — Register user or artist
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Get current user

### Products
- `GET /api/products` — List products (with filters)
- `GET /api/products/:id` — Single product
- `POST /api/products` — Create (artist)
- `PUT /api/products/:id` — Update (artist)
- `DELETE /api/products/:id` — Delete (artist)
- `GET /api/products/artist/my-products` — Artist's products

### Cart
- `GET /api/cart` — Get cart
- `POST /api/cart/add` — Add item
- `PUT /api/cart/update` — Update quantity
- `DELETE /api/cart/remove/:productId` — Remove item
- `DELETE /api/cart/clear` — Clear cart

### Orders
- `POST /api/orders` — Place order
- `GET /api/orders/my-orders` — User orders
- `GET /api/orders/artist-orders` — Artist's received orders
- `PUT /api/orders/:id/status` — Update status (artist)

### Artists
- `GET /api/artists` — All artists
- `GET /api/artists/:id` — Artist profile + products + reviews
- `PUT /api/artists/profile/update` — Update profile (artist)
- `GET /api/artists/dashboard/stats` — Dashboard stats

### Reviews
- `POST /api/reviews` — Submit review
- `GET /api/reviews/product/:id` — Product reviews
- `GET /api/reviews/artist/:id` — Artist reviews

---

## Design System

**Colors:**
- Primary: Warm craft orange (#dc701c)
- Ink: Deep brown (#1a1208)
- Sage: Natural green
- Background: Warm cream (#fdf8f3)

**Fonts:**
- Display: Playfair Display (headings)
- Body: DM Sans (UI text)
- Accent: Cormorant Garamond (quotes/italic)
