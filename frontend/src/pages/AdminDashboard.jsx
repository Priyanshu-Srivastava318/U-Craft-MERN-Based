import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users, ShoppingBag, Package, TrendingUp,
  Trash2, ShieldCheck, Star, RefreshCw, LogOut, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || 'ucraft_admin_secret_2025';
const BASE      = import.meta.env.VITE_API_URL   || 'http://localhost:5000';

const STATUS_COLORS = {
  placed:     { bg: '#EBF5FF', text: '#1D6FA4' },
  confirmed:  { bg: '#EEEBFF', text: '#5B41C4' },
  processing: { bg: '#FFF8EB', text: '#B45309' },
  shipped:    { bg: '#F3EBFF', text: '#7C3AED' },
  delivered:  { bg: '#EBFFF0', text: '#166534' },
  cancelled:  { bg: '#FFEBEB', text: '#B91C1C' },
};
const STATUS_OPTIONS = ['placed','confirmed','processing','shipped','delivered','cancelled'];

const req = (path, opts = {}) =>
  fetch(`${BASE}/api/admin${path}`, {
    headers: { 'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json' },
    ...opts,
  }).then(r => r.json());

// ── Small stat card ───────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={{ background:'white', border:'1px solid #E8DDD4', padding:20 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
        <div style={{ width:30, height:30, background:`${color}18`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Icon size={14} style={{ color }} />
        </div>
        <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'.65rem', fontWeight:600, letterSpacing:'.17em', textTransform:'uppercase', color:'#8C7B6B' }}>{label}</span>
      </div>
      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'2.2rem', fontWeight:600, color:'#1A1208', lineHeight:1 }}>{value}</p>
    </div>
  );
}

// ── Table wrapper ─────────────────────────────────────────────────────────────
function Table({ heads, children }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ background:'#F7F0E6' }}>
            {heads.map(h => (
              <th key={h} style={{ textAlign:'left', padding:'10px 16px', fontFamily:"'DM Sans',sans-serif", fontSize:'.62rem', fontWeight:600, letterSpacing:'.17em', textTransform:'uppercase', color:'#8C7B6B', whiteSpace:'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Tr({ children }) {
  return (
    <tr style={{ borderBottom:'1px solid #F0E8E0' }}
      onMouseEnter={e => e.currentTarget.style.background='#FDFAF5'}
      onMouseLeave={e => e.currentTarget.style.background='white'}>
      {children}
    </tr>
  );
}

function Td({ children, mono }) {
  return (
    <td style={{ padding:'12px 16px', fontFamily: mono ? 'monospace' : "'DM Sans',sans-serif", fontSize:'.83rem', color:'#1A1208', verticalAlign:'middle' }}>
      {children}
    </td>
  );
}

function IconBtn({ onClick, color = '#B91C1C', bg = '#FFEBEB', title, children }) {
  return (
    <button onClick={onClick} title={title}
      style={{ background:bg, border:'none', color, borderRadius:4, padding:'5px 8px', cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4, fontSize:'.75rem', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>
      {children}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const [auth,     setAuth]     = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [tab,      setTab]      = useState('overview');
  const [stats,    setStats]    = useState(null);
  const [users,    setUsers]    = useState([]);
  const [artists,  setArtists]  = useState([]);
  const [products, setProducts] = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [loading,  setLoading]  = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (keyInput === ADMIN_KEY) { setAuth(true); loadAll(); toast.success('Welcome, Admin 👑'); }
    else toast.error('Wrong admin key');
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, u, ar, p, o] = await Promise.all([
        req('/stats'), req('/users'), req('/artists'), req('/products'), req('/orders'),
      ]);
      setStats(s);
      setUsers(Array.isArray(u) ? u : []);
      setArtists(Array.isArray(ar) ? ar : []);
      setProducts(Array.isArray(p) ? p : []);
      setOrders(Array.isArray(o) ? o : []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const deleteUser = async (id) => {
    if (!confirm('Delete this user?')) return;
    await req(`/users/${id}`, { method: 'DELETE' });
    setUsers(u => u.filter(x => x._id !== id));
    toast.success('User deleted');
  };

  const toggleRole = async (id, currentRole) => {
    const newRole = currentRole === 'artist' ? 'user' : 'artist';
    const updated = await req(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role: newRole }) });
    setUsers(u => u.map(x => x._id === id ? updated : x));
    toast.success(`Role changed to ${newRole}`);
  };

  const deleteArtist = async (id) => {
    if (!confirm('Delete this artist profile?')) return;
    await req(`/artists/${id}`, { method: 'DELETE' });
    setArtists(a => a.filter(x => x._id !== id));
    toast.success('Artist deleted');
  };

  const toggleVerify = async (id, current) => {
    const updated = await req(`/artists/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ current }) });
    setArtists(a => a.map(x => x._id === id ? updated : x));
    toast.success(current ? 'Verification removed' : 'Artist verified ✓');
  };

  const deleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    await req(`/products/${id}`, { method: 'DELETE' });
    setProducts(p => p.filter(x => x._id !== id));
    toast.success('Product deleted');
  };

  const toggleFeature = async (id, current) => {
    const updated = await req(`/products/${id}/feature`, { method: 'PATCH', body: JSON.stringify({ current }) });
    setProducts(p => p.map(x => x._id === id ? updated : x));
    toast.success(current ? 'Removed from featured' : 'Product featured ⭐');
  };

  const updateOrderStatus = async (id, status) => {
    const updated = await req(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    setOrders(o => o.map(x => x._id === id ? updated : x));
    toast.success('Order updated');
  };

  const deleteOrder = async (id) => {
    if (!confirm('Delete this order?')) return;
    await req(`/orders/${id}`, { method: 'DELETE' });
    setOrders(o => o.filter(x => x._id !== id));
    toast.success('Order deleted');
  };

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!auth) return (
    <>
      <style>{`:root{--ink:#1A1208;--clay:#C4622D;--parch:#F7F0E6;--stone:#8C7B6B;--cream:#FDFAF5;}`}</style>
      <div style={{ minHeight:'100vh', background:'var(--parch)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ background:'white', border:'1px solid #E8DDD4', padding:40, width:'100%', maxWidth:360, textAlign:'center', boxShadow:'0 8px 32px rgba(26,18,8,.08)' }}>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'.65rem', fontWeight:600, letterSpacing:'.25em', textTransform:'uppercase', color:'var(--clay)', marginBottom:8 }}>U-Craft</p>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'2rem', fontWeight:600, color:'var(--ink)', marginBottom:4 }}>Admin Panel</h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'.82rem', color:'var(--stone)', marginBottom:28 }}>Enter your admin key to continue</p>
          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <input type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)}
              placeholder="Admin secret key" required
              style={{ background:'var(--parch)', border:'1.5px solid #D5CAC0', padding:'12px 16px', fontFamily:"'DM Sans',sans-serif", fontSize:'.9rem', color:'var(--ink)', outline:'none', width:'100%', boxSizing:'border-box', textAlign:'center' }} />
            <button type="submit"
              style={{ background:'var(--ink)', color:'var(--cream)', border:'none', padding:'13px', fontFamily:"'DM Sans',sans-serif", fontSize:'.78rem', fontWeight:600, letterSpacing:'.15em', textTransform:'uppercase', cursor:'pointer', width:'100%' }}>
              Enter Dashboard →
            </button>
          </form>
        </div>
      </div>
    </>
  );

  const TABS = [
    { id:'overview', label:'Overview',  icon:TrendingUp },
    { id:'users',    label:`Users (${users.length})`,    icon:Users },
    { id:'artists',  label:`Artists (${artists.length})`, icon:Star },
    { id:'products', label:`Products (${products.length})`, icon:Package },
    { id:'orders',   label:`Orders (${orders.length})`,  icon:ShoppingBag },
  ];

  return (
    <>
      <style>{`
        :root{--ink:#1A1208;--clay:#C4622D;--parch:#F7F0E6;--stone:#8C7B6B;--cream:#FDFAF5;}
        .adm-tab{font-family:'DM Sans',sans-serif;font-size:.8rem;font-weight:500;padding:10px 16px;border:none;background:none;cursor:pointer;color:#8C7B6B;display:flex;align-items:center;gap:6px;border-bottom:2px solid transparent;white-space:nowrap;transition:color .2s;}
        .adm-tab.active{border-bottom-color:var(--clay);color:var(--clay);font-weight:700;}
        .adm-tab:hover:not(.active){color:var(--ink);}
        @media(max-width:640px){.stats-grid-adm{grid-template-columns:repeat(2,1fr)!important;}}
      `}</style>

      {/* Navbar */}
      <div style={{ background:'white', borderBottom:'1px solid #E8DDD4', position:'sticky', top:0, zIndex:50 }}>
        <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:28, height:28, background:'var(--clay)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ color:'white', fontSize:'.7rem', fontWeight:700, fontFamily:"'DM Sans',sans-serif" }}>UC</span>
            </div>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.1rem', fontWeight:600, color:'var(--ink)' }}>
              U-Craft <span style={{ color:'var(--clay)' }}>Admin</span>
            </span>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={loadAll} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'1px solid #E8DDD4', padding:'6px 12px', fontFamily:"'DM Sans',sans-serif", fontSize:'.75rem', color:'var(--stone)', cursor:'pointer' }}>
              <RefreshCw size={12}/> Refresh
            </button>
            <button onClick={() => setAuth(false)} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'1px solid #FECACA', padding:'6px 12px', fontFamily:"'DM Sans',sans-serif", fontSize:'.75rem', color:'#B91C1C', cursor:'pointer' }}>
              <LogOut size={12}/> Logout
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth:1280, margin:'0 auto', padding:'28px 24px' }}>

        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid #E8DDD4', marginBottom:28, overflowX:'auto', gap:4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`adm-tab ${tab===t.id?'active':''}`}>
              <t.icon size={13}/> {t.label}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ display:'flex', justifyContent:'center', padding:'60px 0' }}>
            <div style={{ width:32, height:32, border:'2px solid #E8DDD4', borderTopColor:'var(--clay)', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {!loading && tab === 'overview' && stats && (
          <>
            <div className="stats-grid-adm" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:28 }}>
              <StatCard icon={Users}       label="Total Users"    value={stats.totalUsers}    color="#3b82f6" />
              <StatCard icon={Star}        label="Artists"        value={stats.totalArtists}  color="#C4622D" />
              <StatCard icon={Package}     label="Products"       value={stats.totalProducts} color="#8b5cf6" />
              <StatCard icon={ShoppingBag} label="Orders"         value={stats.totalOrders}   color="#f59e0b" />
              <StatCard icon={TrendingUp}  label="Revenue"        value={`₹${(stats.totalRevenue||0).toLocaleString()}`} color="#10b981" />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {/* Recent Orders */}
              <div style={{ background:'white', border:'1px solid #E8DDD4', padding:20 }}>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.2rem', fontWeight:600, marginBottom:16, color:'var(--ink)' }}>Recent Orders</p>
                {(stats.recentOrders||[]).map(o => (
                  <div key={o._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #F0E8E0', gap:8 }}>
                    <div style={{ minWidth:0 }}>
                      <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'.85rem', fontWeight:600 }}>#{o.orderNumber}</p>
                      <p style={{ fontSize:'.75rem', color:'var(--stone)' }}>{o.user?.name}</p>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1rem', fontWeight:600 }}>₹{o.total?.toLocaleString()}</p>
                      <span style={{ fontSize:'.68rem', padding:'2px 7px', background:STATUS_COLORS[o.orderStatus]?.bg, color:STATUS_COLORS[o.orderStatus]?.text }}>{o.orderStatus}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Stats */}
              <div style={{ background:'white', border:'1px solid #E8DDD4', padding:20 }}>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.2rem', fontWeight:600, marginBottom:16, color:'var(--ink)' }}>Quick Stats</p>
                {[
                  { label:'Pending Orders',    value: stats.pendingOrders,  color:'#B45309', bg:'#FFF8EB' },
                  { label:'Verified Artists',   value: artists.filter(a=>a.isVerified).length, color:'#166534', bg:'#EBFFF0' },
                  { label:'Featured Products',  value: products.filter(p=>p.isFeatured).length, color:'#5B41C4', bg:'#EEEBFF' },
                  { label:'Out of Stock',        value: products.filter(p=>p.stock===0).length, color:'#B91C1C', bg:'#FFEBEB' },
                ].map(s => (
                  <div key={s.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #F0E8E0' }}>
                    <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'.85rem', color:'var(--stone)' }}>{s.label}</p>
                    <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.2rem', fontWeight:600, padding:'2px 10px', background:s.bg, color:s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* ── USERS ── */}
        {!loading && tab === 'users' && (
          <div style={{ background:'white', border:'1px solid #E8DDD4' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #E8DDD4' }}>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', fontWeight:600, color:'var(--ink)' }}>All Users</p>
            </div>
            <Table heads={['Name', 'Email', 'Role', 'Joined', 'Actions']}>
              {users.map(u => (
                <Tr key={u._id}>
                  <Td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:32, height:32, background:'rgba(196,98,45,.12)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Cormorant Garamond',serif", fontWeight:700, color:'var(--clay)', flexShrink:0 }}>
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight:600 }}>{u.name}</span>
                    </div>
                  </Td>
                  <Td>{u.email}</Td>
                  <Td>
                    <span style={{ fontSize:'.72rem', padding:'3px 8px', background: u.role==='artist'?'#FFF8EB':'#EBF5FF', color: u.role==='artist'?'#B45309':'#1D6FA4', fontFamily:"'DM Sans',sans-serif", fontWeight:600, textTransform:'capitalize' }}>
                      {u.role}
                    </span>
                  </Td>
                  <Td mono>{new Date(u.createdAt).toLocaleDateString('en-IN')}</Td>
                  <Td>
                    <div style={{ display:'flex', gap:6 }}>
                      <IconBtn onClick={() => toggleRole(u._id, u.role)} color="#5B41C4" bg="#EEEBFF" title="Toggle role">
                        <Users size={11}/> {u.role==='artist'?'→ User':'→ Artist'}
                      </IconBtn>
                      <IconBtn onClick={() => deleteUser(u._id)} title="Delete user">
                        <Trash2 size={11}/> Delete
                      </IconBtn>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
          </div>
        )}

        {/* ── ARTISTS ── */}
        {!loading && tab === 'artists' && (
          <div style={{ background:'white', border:'1px solid #E8DDD4' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #E8DDD4' }}>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', fontWeight:600, color:'var(--ink)' }}>All Artists</p>
            </div>
            <Table heads={['Brand', 'Owner', 'Specialty', 'Sales', 'Revenue', 'Verified', 'Actions']}>
              {artists.map(a => (
                <Tr key={a._id}>
                  <Td><span style={{ fontWeight:600 }}>{a.brandName}</span></Td>
                  <Td>
                    <p style={{ fontWeight:500 }}>{a.user?.name}</p>
                    <p style={{ fontSize:'.72rem', color:'var(--stone)' }}>{a.user?.email}</p>
                  </Td>
                  <Td>{a.specialty || '—'}</Td>
                  <Td><span style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600 }}>{a.totalSales}</span></Td>
                  <Td><span style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:'#166534' }}>₹{(a.totalRevenue||0).toLocaleString()}</span></Td>
                  <Td>
                    <span style={{ fontSize:'.72rem', padding:'3px 8px', background:a.isVerified?'#EBFFF0':'#F7F0E6', color:a.isVerified?'#166534':'#8C7B6B', fontWeight:600 }}>
                      {a.isVerified ? '✓ Verified' : 'Unverified'}
                    </span>
                  </Td>
                  <Td>
                    <div style={{ display:'flex', gap:6 }}>
                      <IconBtn onClick={() => toggleVerify(a._id, a.isVerified)} color={a.isVerified?'#B45309':'#166634'} bg={a.isVerified?'#FFF8EB':'#EBFFF0'} title="Toggle verify">
                        <CheckCircle size={11}/> {a.isVerified ? 'Unverify' : 'Verify'}
                      </IconBtn>
                      <IconBtn onClick={() => deleteArtist(a._id)} title="Delete artist">
                        <Trash2 size={11}/> Delete
                      </IconBtn>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
          </div>
        )}

        {/* ── PRODUCTS ── */}
        {!loading && tab === 'products' && (
          <div style={{ background:'white', border:'1px solid #E8DDD4' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #E8DDD4' }}>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', fontWeight:600, color:'var(--ink)' }}>All Products</p>
            </div>
            <Table heads={['Product', 'Artist', 'Category', 'Price', 'Stock', 'Sold', 'Featured', 'Actions']}>
              {products.map(p => (
                <Tr key={p._id}>
                  <Td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <img src={p.images?.[0] || 'https://placehold.co/36/F7F0E6/8C7B6B?text=P'} alt=""
                        style={{ width:36, height:36, objectFit:'cover', flexShrink:0 }}/>
                      <span style={{ fontWeight:600, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}>{p.name}</span>
                    </div>
                  </Td>
                  <Td>{p.artist?.brandName || '—'}</Td>
                  <Td><span style={{ fontSize:'.75rem', color:'var(--stone)' }}>{p.category}</span></Td>
                  <Td><span style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600 }}>₹{p.price?.toLocaleString()}</span></Td>
                  <Td>
                    <span style={{ fontSize:'.72rem', padding:'3px 7px', background:p.stock===0?'#FFEBEB':p.stock<=3?'#FFF8EB':'#EBFFF0', color:p.stock===0?'#B91C1C':p.stock<=3?'#B45309':'#166534', fontWeight:600 }}>
                      {p.stock===0?'Out':p.stock}
                    </span>
                  </Td>
                  <Td>{p.sold||0}</Td>
                  <Td>
                    <span style={{ fontSize:'.72rem', padding:'3px 7px', background:p.isFeatured?'#EEEBFF':'#F7F0E6', color:p.isFeatured?'#5B41C4':'#8C7B6B', fontWeight:600 }}>
                      {p.isFeatured ? '⭐ Yes' : 'No'}
                    </span>
                  </Td>
                  <Td>
                    <div style={{ display:'flex', gap:6 }}>
                      <IconBtn onClick={() => toggleFeature(p._id, p.isFeatured)} color="#5B41C4" bg="#EEEBFF" title="Toggle feature">
                        <Star size={11}/> {p.isFeatured ? 'Unfeature' : 'Feature'}
                      </IconBtn>
                      <IconBtn onClick={() => deleteProduct(p._id)} title="Delete product">
                        <Trash2 size={11}/> Delete
                      </IconBtn>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
          </div>
        )}

        {/* ── ORDERS ── */}
        {!loading && tab === 'orders' && (
          <div style={{ background:'white', border:'1px solid #E8DDD4' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #E8DDD4' }}>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', fontWeight:600, color:'var(--ink)' }}>All Orders</p>
            </div>
            <Table heads={['Order #', 'Customer', 'Total', 'Payment', 'Status', 'Date', 'Actions']}>
              {orders.map(o => (
                <Tr key={o._id}>
                  <Td mono>#{o.orderNumber}</Td>
                  <Td>
                    <p style={{ fontWeight:600 }}>{o.user?.name}</p>
                    <p style={{ fontSize:'.72rem', color:'var(--stone)' }}>{o.user?.email}</p>
                  </Td>
                  <Td><span style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600, fontSize:'1rem' }}>₹{o.total?.toLocaleString()}</span></Td>
                  <Td>
                    <span style={{ fontSize:'.72rem', padding:'3px 7px', background:o.paymentStatus==='paid'?'#EBFFF0':'#FFF8EB', color:o.paymentStatus==='paid'?'#166534':'#B45309', fontWeight:600 }}>
                      {o.paymentStatus}
                    </span>
                  </Td>
                  <Td>
                    <select value={o.orderStatus} onChange={e => updateOrderStatus(o._id, e.target.value)}
                      style={{ fontSize:'.75rem', padding:'5px 8px', border:'none', outline:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600, background:STATUS_COLORS[o.orderStatus]?.bg, color:STATUS_COLORS[o.orderStatus]?.text }}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s} style={{ background:'white', color:'#1A1208' }}>{s}</option>)}
                    </select>
                  </Td>
                  <Td mono>{new Date(o.createdAt).toLocaleDateString('en-IN')}</Td>
                  <Td>
                    <IconBtn onClick={() => deleteOrder(o._id)} title="Delete order">
                      <Trash2 size={11}/> Delete
                    </IconBtn>
                  </Td>
                </Tr>
              ))}
            </Table>
          </div>
        )}
      </div>
    </>
  );
}