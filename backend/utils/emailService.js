const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const FROM = `UCraft <${process.env.EMAIL_USER}>`;

// ── Base HTML wrapper ────────────────────────────────────────
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { background:#F5F0EA; font-family:'Helvetica Neue',Arial,sans-serif; color:#1A1208; }
    .wrapper { max-width:580px; margin:32px auto; background:white; border:1px solid #E8DDD4; }
    .header { background:#1A1208; padding:28px 36px; text-align:center; }
    .header h1 { color:white; font-size:22px; font-weight:300; letter-spacing:4px; text-transform:uppercase; }
    .header span { color:#C4622D; font-size:26px; }
    .body { padding:36px; }
    .greeting { font-size:22px; font-weight:300; margin-bottom:8px; color:#1A1208; }
    .subtext { font-size:14px; color:#8C7B6B; margin-bottom:28px; line-height:1.6; }
    .order-box { background:#F7F0E6; border:1px solid #EDE3D5; padding:20px 24px; margin-bottom:24px; }
    .order-num { font-size:11px; font-weight:700; letter-spacing:2px; text-transform:uppercase; color:#8C7B6B; margin-bottom:4px; }
    .order-val { font-size:24px; font-weight:600; color:#1A1208; }
    .divider { border:none; border-top:1px solid #EDE3D5; margin:24px 0; }
    .item-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #F0E8E0; }
    .item-row:last-child { border-bottom:none; }
    .item-name { font-size:14px; font-weight:500; }
    .item-qty { font-size:12px; color:#8C7B6B; margin-top:2px; }
    .item-price { font-size:14px; font-weight:600; }
    .total-row { display:flex; justify-content:space-between; padding:14px 0 0; }
    .total-label { font-size:12px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; color:#8C7B6B; }
    .total-val { font-size:20px; font-weight:700; color:#C4622D; }
    .btn { display:inline-block; background:#C4622D; color:white !important; text-decoration:none; padding:13px 28px; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase; margin:20px 0; }
    .address-box { background:#F7F0E6; padding:16px 20px; font-size:13px; line-height:1.8; color:#6B5E52; }
    .footer { background:#F7F0E6; padding:20px 36px; text-align:center; border-top:1px solid #EDE3D5; }
    .footer p { font-size:11px; color:#8C7B6B; line-height:1.8; }
    .footer a { color:#C4622D; text-decoration:none; }
    .highlight { color:#C4622D; font-weight:600; }
    .stage { display:inline-block; flex:1; text-align:center; padding:8px 4px; font-size:10px; font-weight:600; letter-spacing:1px; text-transform:uppercase; background:#F7F0E6; border:1px solid #EDE3D5; color:#B0A090; }
    .stage.active { background:#C4622D; color:white; border-color:#C4622D; }
    .stage.done { background:#1A1208; color:white; border-color:#1A1208; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>U<span>·</span>Craft</h1>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>
        U-Craft — Artisanal Marketplace<br/>
        <a href="${process.env.CLIENT_URL}">${process.env.CLIENT_URL}</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

// ── Status meta ──────────────────────────────────────────────
const STATUS_META = {
  placed:     { color:'#1D6FA4', bg:'#EBF5FF', label:'Order Placed' },
  confirmed:  { color:'#5B41C4', bg:'#EEEBFF', label:'Confirmed' },
  processing: { color:'#B45309', bg:'#FFF8EB', label:'Processing' },
  shipped:    { color:'#7C3AED', bg:'#F3EBFF', label:'Shipped' },
  delivered:  { color:'#166534', bg:'#EBFFF0', label:'Delivered' },
  cancelled:  { color:'#B91C1C', bg:'#FFEBEB', label:'Cancelled' },
};

const STAGES = ['placed','confirmed','processing','shipped','delivered'];

const renderItems = (items) => items.map(item => `
  <div class="item-row">
    <div>
      <div class="item-name">${item.name}</div>
      <div class="item-qty">Qty: ${item.quantity}</div>
    </div>
    <div class="item-price">₹${(item.price * item.quantity).toLocaleString()}</div>
  </div>
`).join('');

const renderStages = (currentStatus) => {
  const currentIdx = STAGES.indexOf(currentStatus);
  return `<div style="display:flex;gap:0;margin:20px 0;">` +
    STAGES.map((stage, i) => {
      let cls = '';
      if (i < currentIdx) cls = 'done';
      else if (i === currentIdx) cls = 'active';
      return `<div class="stage ${cls}" style="flex:1">${stage}</div>`;
    }).join('') +
  `</div>`;
};

// ── Send helper ──────────────────────────────────────────────
const send = async ({ to, subject, html }) => {
  await transporter.sendMail({ from: FROM, to, subject, html });
};

// ════════════════════════════════════════════════════════════
// 1. ORDER PLACED — buyer ko
// ════════════════════════════════════════════════════════════
const sendOrderPlaced = async ({ buyerEmail, buyerName, order }) => {
  const html = baseTemplate(`
    <p class="greeting">Thank you, ${buyerName}! 🎉</p>
    <p class="subtext">Your order has been placed successfully. The artist will confirm it shortly.</p>
    <div class="order-box">
      <div class="order-num">Order Number</div>
      <div class="order-val">#${order.orderNumber}</div>
    </div>
    ${renderStages('placed')}
    <hr class="divider"/>
    ${renderItems(order.items)}
    <hr class="divider"/>
    <div class="total-row">
      <span class="total-label">Subtotal</span>
      <span>₹${order.subtotal?.toLocaleString()}</span>
    </div>
    <div class="total-row" style="padding-top:6px">
      <span class="total-label">Shipping</span>
      <span>${order.shipping === 0 ? 'FREE' : '₹' + order.shipping}</span>
    </div>
    <div class="total-row" style="border-top:1px solid #EDE3D5;margin-top:10px;padding-top:14px">
      <span class="total-label">Total</span>
      <span class="total-val">₹${order.total?.toLocaleString()}</span>
    </div>
    <hr class="divider"/>
    <p style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8C7B6B;margin-bottom:8px">Shipping To</p>
    <div class="address-box">
      ${order.shippingAddress?.name}<br/>
      ${order.shippingAddress?.street}, ${order.shippingAddress?.city}<br/>
      ${order.shippingAddress?.state} — ${order.shippingAddress?.pincode}<br/>
      📞 ${order.shippingAddress?.phone}
    </div>
    <br/>
    <p style="font-size:13px;color:#6B5E52">Payment: <span class="highlight">${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}</span></p>
    <a href="${process.env.CLIENT_URL}/orders" class="btn">Track Your Order</a>
  `);
  await send({ to: buyerEmail, subject: `Order Placed — #${order.orderNumber} | U-Craft`, html });
};

// ════════════════════════════════════════════════════════════
// 2. ORDER STATUS UPDATE — buyer ko
// ════════════════════════════════════════════════════════════
const sendOrderStatusUpdate = async ({ buyerEmail, buyerName, order, newStatus }) => {
  const meta = STATUS_META[newStatus] || STATUS_META['placed'];
  const messages = {
    confirmed:  'Great news! The artist has confirmed your order.',
    processing: 'Your order is being handcrafted with love!',
    shipped:    'Your order is on its way!',
    delivered:  'Your order has been delivered! We hope you love it.',
    cancelled:  'Your order has been cancelled.',
  };
  const html = baseTemplate(`
    <p class="greeting">Order Update, ${buyerName}</p>
    <p class="subtext">${messages[newStatus] || 'Your order status has been updated.'}</p>
    <div style="display:inline-block;padding:8px 20px;background:${meta.bg};color:${meta.color};font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:24px;">
      ${meta.label}
    </div>
    <div class="order-box">
      <div class="order-num">Order Number</div>
      <div class="order-val">#${order.orderNumber}</div>
    </div>
    ${newStatus !== 'cancelled' ? renderStages(newStatus) : ''}
    <hr class="divider"/>
    ${renderItems(order.items)}
    <hr class="divider"/>
    <div class="total-row">
      <span class="total-label">Total</span>
      <span class="total-val">₹${order.total?.toLocaleString()}</span>
    </div>
    <a href="${process.env.CLIENT_URL}/orders" class="btn">View Order Details</a>
  `);
  await send({ to: buyerEmail, subject: `Order ${meta.label} — #${order.orderNumber} | U-Craft`, html });
};

// ════════════════════════════════════════════════════════════
// 3. NEW ORDER — artist ko
// ════════════════════════════════════════════════════════════
const sendNewOrderToArtist = async ({ artistEmail, artistName, order, buyerName }) => {
  const html = baseTemplate(`
    <p class="greeting">New Order! 🛍️</p>
    <p class="subtext"><span class="highlight">${buyerName}</span> has placed an order. Please confirm it from your dashboard.</p>
    <div class="order-box">
      <div class="order-num">Order Number</div>
      <div class="order-val">#${order.orderNumber}</div>
    </div>
    <hr class="divider"/>
    ${renderItems(order.items)}
    <hr class="divider"/>
    <div class="total-row">
      <span class="total-label">Total</span>
      <span class="total-val">₹${order.total?.toLocaleString()}</span>
    </div>
    <hr class="divider"/>
    <p style="font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#8C7B6B;margin-bottom:8px">Ship To</p>
    <div class="address-box">
      ${order.shippingAddress?.name}<br/>
      ${order.shippingAddress?.street}, ${order.shippingAddress?.city}<br/>
      ${order.shippingAddress?.state} — ${order.shippingAddress?.pincode}<br/>
      📞 ${order.shippingAddress?.phone}
    </div>
    <br/>
    <p style="font-size:13px;color:#6B5E52">Payment: <span class="highlight">${order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online — Already Paid ✅'}</span></p>
    <a href="${process.env.CLIENT_URL}/artist/dashboard" class="btn">Go to Dashboard</a>
  `);
  await send({ to: artistEmail, subject: `New Order #${order.orderNumber} — Action Required | U-Craft`, html });
};

// ════════════════════════════════════════════════════════════
// 4. WELCOME EMAIL
// ════════════════════════════════════════════════════════════
const sendWelcomeEmail = async ({ email, name, role }) => {
  const isArtist = role === 'artist';
  const html = baseTemplate(`
    <p class="greeting">Welcome to U·Craft, ${name}! ✨</p>
    <p class="subtext">${isArtist
      ? 'Your artist account is ready. Start listing your handcrafted products and reach buyers who appreciate authentic artisanship.'
      : 'Discover unique handcrafted products made by talented artists. Every purchase supports independent artisans.'
    }</p>
    <hr class="divider"/>
    ${isArtist ? `
      <p style="font-size:13px;color:#6B5E52;line-height:1.8;margin-bottom:16px">
        <strong>Get started:</strong><br/>
        → Go to your Dashboard<br/>
        → Add your first product with photos<br/>
        → Set your price and stock<br/>
        → Start receiving orders!
      </p>
      <a href="${process.env.CLIENT_URL}/artist/dashboard" class="btn">Go to Dashboard</a>
    ` : `
      <p style="font-size:13px;color:#6B5E52;line-height:1.8;margin-bottom:16px">
        <strong>What's waiting for you:</strong><br/>
        → Handcrafted pottery, jewelry, textiles & more<br/>
        → Direct from the artists who make them<br/>
        → Every piece is unique
      </p>
      <a href="${process.env.CLIENT_URL}/shop" class="btn">Explore the Shop</a>
    `}
  `);
  await send({ to: email, subject: `Welcome to U·Craft, ${name}!`, html });
};

// ── Safe wrappers ────────────────────────────────────────────
const safeEmail = (fn) => async (...args) => {
  try { await fn(...args); }
  catch (err) { console.error('Email error:', err.message); }
};

module.exports = {
  sendOrderPlaced:       safeEmail(sendOrderPlaced),
  sendOrderStatusUpdate: safeEmail(sendOrderStatusUpdate),
  sendNewOrderToArtist:  safeEmail(sendNewOrderToArtist),
  sendWelcomeEmail:      safeEmail(sendWelcomeEmail),
};