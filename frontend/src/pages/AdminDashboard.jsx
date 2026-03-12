import { useState, useEffect } from 'react';
import {
  Users, ShoppingBag, Package, TrendingUp,
  Trash2, ShieldCheck, Star, RefreshCw, LogOut, CheckCircle,
  AlertCircle, XCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || 'ucraft_admin_secret_2025';
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

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
  fetch(`${BASE}/admin${path}`, {
    headers: { 'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json' },
    ...opts,
  }).then(r => r.json());

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

export default function AdminDashboard() {
  const [auth,     setAuth]     = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [tab,      setTab]      = useState('overview');
  const [stats,    setStats]    = useState(null);
  const [users,    setUsers]    = useState([]);
  const [artists,  setArtists]  = useState([]);
  const [products, setProducts] = useState([]);
  const [orders,   setOrders]   = useState([]);
  const [refunds,  setRefunds]  = useState([]);
  const [loading,  setLoading]  = useState(false);

  // Resolve modal
  const [resolveModal, setResolveModal] = useState(null); // { orderId, action: 'approve'|'reject' }
  const [adminNote,    setAdminNote]    = useState('');
  const [resolving,    setResolving]    = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (keyInput === ADMIN_KEY) { setAuth(true); loadAll(); toast.success('Welcome, Admin 👑'); }
    else toast.error('Wrong admin key');
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, u, ar, p, o, r] = await Promise.all([
        req('/stats'), req('/users'), req('/artists'), req('/products'), req('/orders'), req('/refund-requests'),
      ]);
      setStats(s);
      setUsers(Array.isArray(u) ? u : []);
      setArtists(Array.isArray(ar) ? ar : []);
      setProducts(Array.isArray(p) ? p : []);
      setOrders(Array.isArray(o) ? o : []);
      setRefunds(Array.isArray(r) ? r : []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  // ── Actions ──
  const deleteUser    = async (id) => { if (!confirm('Delete this user?')) return; await req(`/users/${id}`, { method: 'DELETE' }); setUsers(u => u.filter(x => x._id !== id)); toast.success('User deleted'); };
  const toggleRole    = async (id, currentRole) => { const newRole = currentRole === 'artist' ? 'user' : 'artist'; const updated = await req(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role: newRole }) }); setUsers(u => u.map(x => x._id === id ? updated : x)); toast.success(`Role changed to ${newRole}`); };
  const deleteArtist  = async (id) => { if (!confirm('Delete this artist profile?')) return; await req(`/artists/${id}`, { method: 'DELETE' }); setArtists(a => a.filter(x => x._id !== id)); toast.success('Artist deleted'); };
  const toggleVerify  = async (id, current) => { const updated = await req(`/artists/${id}/verify`, { method: 'PATCH', body: JSON.stringify({ current }) }); setArtists(a => a.map(x => x._id === id ? updated : x)); toast.success(current ? 'Verification removed' : 'Artist verified ✓'); };
  const deleteProduct = async (id) => { if (!confirm('Delete this product?')) return; await req(`/products/${id}`, { method: 'DELETE' }); setProducts(p => p.filter(x => x._id !== id)); toast.success('Product deleted'); };
  const toggleFeature = async (id, current) => { const updated = await req(`/products/${id}/feature`, { method: 'PATCH', body: JSON.stringify({ current }) }); setProducts(p => p.map(x => x._id === id ? updated : x)); toast.success(current ? 'Removed from featured' : 'Product featured ⭐'); };
  const updateOrderStatus = async (id, status) => { const updated = await req(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }); setOrders(o => o.map(x => x._id === id ? updated : x)); toast.success('Order updated'); };
  const deleteOrder   = async (id) => { if (!confirm('Delete this order?')) return; await req(`/orders/${id}`, { method: 'DELETE' }); setOrders(o => o.filter(x => x._id !== id)); toast.success('Order deleted'); };

  // ── Refund resolve ──
  const handleResolve = async () => {
    if (!resolveModal) return;
    setResolving(true);
    try {
      const { orderId, action } = resolveModal;
      const updated = await req(`/refund-requests/${orderId}/${action}`, {
        method: 'PATCH',
        body: JSON.stringify({ adminNote }),
      });
      setRefunds(r => r.filter(x => x._id !== orderId));
      setOrders(o => o.map(x => x._id === orderId ? updated : x));
      toast.success(action === 'approve' ? 'Refund approved ✓' : 'Refund rejected');
      setResolveModal(null);
      setAdminNote('');
      // Update pending count in stats
      setStats(s => s ? { ...s, pendingRefunds: Math.max(0, (s.pendingRefunds || 1) - 1) } : s);
    } catch { toast.error('Failed to resolve request'); }
    finally { setResolving(false); }
  };

  if (!auth) return (
    <>
      <style>{`:root{--ink:#1A1208;--clay:#C4622D;--parch:#F7F0E6;--stone:#8C7B6B;--cream:#FDFAF5;}`}</style>
      <div style={{ minHeight:'100vh', background:'var(--parch)', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
        <div style={{ background:'white', border:'1px solid #E8DDD4', padding:40, width:'100%', maxWidth:360, textAlign:'center', boxShadow:'0 8px 32px rgba(26,18,8,.08)' }}>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'.65rem', fontWeight:600, letterSpacing:'.25em', textTransform:'uppercase', color:'var(--clay)', marginBottom:8 }}>U-Craft</p>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'2rem', fontWeight:600, color:'var(--ink)', marginBottom:4 }}>Admin Panel</h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'.82rem', color:'var(--stone)', marginBottom:28 }}>Enter your admin key to continue</p>
          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <input type="password" value={keyInput} onChange={e => setKeyInput(e.target.value)} placeholder="Admin secret key" required
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
    { id:'overview', label:'Overview',   icon:TrendingUp },
    { id:'users',    label:`Users (${users.length})`,     icon:Users },
    { id:'artists',  label:`Artists (${artists.length})`, icon:Star },
    { id:'products', label:`Products (${products.length})`, icon:Package },
    { id:'orders',   label:`Orders (${orders.length})`,   icon:ShoppingBag },
    { id:'refunds',  label:`Refunds ${refunds.length > 0 ? `(${refunds.length})` : ''}`, icon:AlertCircle },
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

      {/* Resolve Modal */}
      {resolveModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'white', padding:32, maxWidth:420, width:'100%', border:'1px solid #E8DDD4' }}>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.4rem', fontWeight:600, marginBottom:8 }}>
              {resolveModal.action === 'approve' ? '✓ Approve Refund' : '✕ Reject Refund'}
            </h3>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.85rem', color:'#6B5E52', marginBottom:16, lineHeight:1.6 }}>
              {resolveModal.action === 'approve'
                ? 'This will mark the order as cancelled. Process the refund manually via Razorpay dashboard.'
                : 'Provide a reason for rejection. This will be shown to the user.'}
            </p>
            <textarea
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder={resolveModal.action === 'approve' ? 'Optional note to user...' : 'Reason for rejection (required)...'}
              rows={3}
              style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #E8DDD4', fontFamily:"'DM Sans',sans-serif", fontSize:'0.85rem', resize:'none', outline:'none', marginBottom:16, boxSizing:'border-box' }}
            />
            <div style={{ display:'flex', gap:12 }}>
              <button onClick={handleResolve} disabled={resolving || (resolveModal.action === 'reject' && !adminNote.trim())}
                style={{ flex:1, padding:'11px', background: resolveModal.action === 'approve' ? '#166534' : '#B91C1C', color:'white', border:'none', fontFamily:"'DM Sans',sans-serif", fontSize:'0.82rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', opacity: resolving ? 0.6 : 1 }}>
                {resolving ? 'Processing…' : resolveModal.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
              <button onClick={() => { setResolveModal(null); setAdminNote(''); }}
                style={{ flex:1, padding:'11px', background:'transparent', color:'#1A1208', border:'1.5px solid #1A1208', fontFamily:"'DM Sans',sans-serif", fontSize:'0.82rem', fontWeight:600, cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
              <t.icon size={13}/>
              {t.label}
              {t.id === 'refunds' && refunds.length > 0 && (
                <span style={{ background:'#B91C1C', color:'white', borderRadius:'50%', width:16, height:16, display:'inline-flex', alignItems:'center', justifyContent:'center', fontSize:'.6rem', fontWeight:700 }}>
                  {refunds.length}
                </span>
              )}
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

              <div style={{ background:'white', border:'1px solid #E8DDD4', padding:20 }}>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.2rem', fontWeight:600, marginBottom:16, color:'var(--ink)' }}>Quick Stats</p>
                {[
                  { label:'Pending Orders',    value: stats.pendingOrders,   color:'#B45309', bg:'#FFF8EB' },
                  { label:'Pending Refunds',   value: stats.pendingRefunds || 0, color:'#B91C1C', bg:'#FFEBEB' },
                  { label:'Verified Artists',  value: artists.filter(a=>a.isVerified).length, color:'#166534', bg:'#EBFFF0' },
                  { label:'Featured Products', value: products.filter(p=>p.isFeatured).length, color:'#5B41C4', bg:'#EEEBFF' },
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
                  <Td><span style={{ fontSize:'.72rem', padding:'3px 8px', background: u.role==='artist'?'#FFF8EB':'#EBF5FF', color: u.role==='artist'?'#B45309':'#1D6FA4', fontWeight:600, textTransform:'capitalize' }}>{u.role}</span></Td>
                  <Td mono>{new Date(u.createdAt).toLocaleDateString('en-IN')}</Td>
                  <Td>
                    <div style={{ display:'flex', gap:6 }}>
                      <IconBtn onClick={() => toggleRole(u._id, u.role)} color="#5B41C4" bg="#EEEBFF"><Users size={11}/> {u.role==='artist'?'→ User':'→ Artist'}</IconBtn>
                      <IconBtn onClick={() => deleteUser(u._id)}><Trash2 size={11}/> Delete</IconBtn>
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
                  <Td><p style={{ fontWeight:500 }}>{a.user?.name}</p><p style={{ fontSize:'.72rem', color:'var(--stone)' }}>{a.user?.email}</p></Td>
                  <Td>{a.specialty || '—'}</Td>
                  <Td><span style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600 }}>{a.totalSales}</span></Td>
                  <Td><span style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600, color:'#166534' }}>₹{(a.totalRevenue||0).toLocaleString()}</span></Td>
                  <Td><span style={{ fontSize:'.72rem', padding:'3px 8px', background:a.isVerified?'#EBFFF0':'#F7F0E6', color:a.isVerified?'#166534':'#8C7B6B', fontWeight:600 }}>{a.isVerified ? '✓ Verified' : 'Unverified'}</span></Td>
                  <Td>
                    <div style={{ display:'flex', gap:6 }}>
                      <IconBtn onClick={() => toggleVerify(a._id, a.isVerified)} color={a.isVerified?'#B45309':'#166634'} bg={a.isVerified?'#FFF8EB':'#EBFFF0'}><CheckCircle size={11}/> {a.isVerified ? 'Unverify' : 'Verify'}</IconBtn>
                      <IconBtn onClick={() => deleteArtist(a._id)}><Trash2 size={11}/> Delete</IconBtn>
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
                      <img src={p.images?.[0] || 'https://placehold.co/36/F7F0E6/8C7B6B?text=P'} alt="" style={{ width:36, height:36, objectFit:'cover', flexShrink:0 }}/>
                      <span style={{ fontWeight:600, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', display:'block' }}>{p.name}</span>
                    </div>
                  </Td>
                  <Td>{p.artist?.brandName || '—'}</Td>
                  <Td><span style={{ fontSize:'.75rem', color:'var(--stone)' }}>{p.category}</span></Td>
                  <Td><span style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600 }}>₹{p.price?.toLocaleString()}</span></Td>
                  <Td><span style={{ fontSize:'.72rem', padding:'3px 7px', background:p.stock===0?'#FFEBEB':p.stock<=3?'#FFF8EB':'#EBFFF0', color:p.stock===0?'#B91C1C':p.stock<=3?'#B45309':'#166534', fontWeight:600 }}>{p.stock===0?'Out':p.stock}</span></Td>
                  <Td>{p.sold||0}</Td>
                  <Td><span style={{ fontSize:'.72rem', padding:'3px 7px', background:p.isFeatured?'#EEEBFF':'#F7F0E6', color:p.isFeatured?'#5B41C4':'#8C7B6B', fontWeight:600 }}>{p.isFeatured ? '⭐ Yes' : 'No'}</span></Td>
                  <Td>
                    <div style={{ display:'flex', gap:6 }}>
                      <IconBtn onClick={() => toggleFeature(p._id, p.isFeatured)} color="#5B41C4" bg="#EEEBFF"><Star size={11}/> {p.isFeatured ? 'Unfeature' : 'Feature'}</IconBtn>
                      <IconBtn onClick={() => deleteProduct(p._id)}><Trash2 size={11}/> Delete</IconBtn>
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
                  <Td><p style={{ fontWeight:600 }}>{o.user?.name}</p><p style={{ fontSize:'.72rem', color:'var(--stone)' }}>{o.user?.email}</p></Td>
                  <Td><span style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600, fontSize:'1rem' }}>₹{o.total?.toLocaleString()}</span></Td>
                  <Td><span style={{ fontSize:'.72rem', padding:'3px 7px', background:o.paymentStatus==='paid'?'#EBFFF0':'#FFF8EB', color:o.paymentStatus==='paid'?'#166534':'#B45309', fontWeight:600 }}>{o.paymentStatus}</span></Td>
                  <Td>
                    <select value={o.orderStatus} onChange={e => updateOrderStatus(o._id, e.target.value)}
                      style={{ fontSize:'.75rem', padding:'5px 8px', border:'none', outline:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600, background:STATUS_COLORS[o.orderStatus]?.bg, color:STATUS_COLORS[o.orderStatus]?.text }}>
                      {STATUS_OPTIONS.map(s => <option key={s} value={s} style={{ background:'white', color:'#1A1208' }}>{s}</option>)}
                    </select>
                  </Td>
                  <Td mono>{new Date(o.createdAt).toLocaleDateString('en-IN')}</Td>
                  <Td><IconBtn onClick={() => deleteOrder(o._id)}><Trash2 size={11}/> Delete</IconBtn></Td>
                </Tr>
              ))}
            </Table>
          </div>
        )}

        {/* ── REFUND REQUESTS ── */}
        {!loading && tab === 'refunds' && (
          <div style={{ background:'white', border:'1px solid #E8DDD4' }}>
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #E8DDD4', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', fontWeight:600, color:'var(--ink)' }}>
                Pending Refund Requests
              </p>
              {refunds.length > 0 && (
                <span style={{ background:'#FFEBEB', color:'#B91C1C', fontSize:'.75rem', fontWeight:700, padding:'4px 12px' }}>
                  {refunds.length} pending
                </span>
              )}
            </div>

            {refunds.length === 0 ? (
              <div style={{ padding:'60px 24px', textAlign:'center' }}>
                <CheckCircle size={40} style={{ color:'#D1FAE5', margin:'0 auto 12px' }}/>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', color:'#8C7B6B' }}>No pending refund requests</p>
              </div>
            ) : (
              <Table heads={['Order #', 'Customer', 'Amount', 'Reason', 'Requested On', 'Actions']}>
                {refunds.map(o => (
                  <Tr key={o._id}>
                    <Td mono>#{o.orderNumber}</Td>
                    <Td>
                      <p style={{ fontWeight:600 }}>{o.user?.name}</p>
                      <p style={{ fontSize:'.72rem', color:'var(--stone)' }}>{o.user?.email}</p>
                    </Td>
                    <Td><span style={{ fontFamily:"'Cormorant Garamond',serif", fontWeight:600, fontSize:'1rem' }}>₹{o.total?.toLocaleString()}</span></Td>
                    <Td>
                      <span style={{ fontSize:'.82rem', color:'#1A1208' }}>{o.refundRequest?.reason}</span>
                      <p style={{ fontSize:'.72rem', color:'var(--stone)', marginTop:2 }}>
                        Status: <span style={{ background:STATUS_COLORS[o.orderStatus]?.bg, color:STATUS_COLORS[o.orderStatus]?.text, padding:'1px 6px', fontSize:'.68rem', fontWeight:600 }}>{o.orderStatus}</span>
                        {o.paymentStatus === 'paid' && <span style={{ marginLeft:6, background:'#EBFFF0', color:'#166534', padding:'1px 6px', fontSize:'.68rem', fontWeight:600 }}>Paid</span>}
                      </p>
                    </Td>
                    <Td mono>{o.refundRequest?.requestedAt ? new Date(o.refundRequest.requestedAt).toLocaleDateString('en-IN') : '—'}</Td>
                    <Td>
                      <div style={{ display:'flex', gap:6 }}>
                        <IconBtn
                          onClick={() => { setResolveModal({ orderId: o._id, action: 'approve' }); setAdminNote(''); }}
                          color="#166534" bg="#EBFFF0">
                          <CheckCircle size={11}/> Approve
                        </IconBtn>
                        <IconBtn
                          onClick={() => { setResolveModal({ orderId: o._id, action: 'reject' }); setAdminNote(''); }}
                          color="#B91C1C" bg="#FFEBEB">
                          <XCircle size={11}/> Reject
                        </IconBtn>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Table>
            )}
          </div>
        )}
      </div>
    </>
  );
}