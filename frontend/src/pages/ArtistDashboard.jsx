import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, ShoppingBag, Star, TrendingUp,
  Plus, Edit2, Trash2, Eye, Bell, X, ImagePlus
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  placed:     { bg: '#EBF5FF', text: '#1D6FA4' },
  confirmed:  { bg: '#EEEBFF', text: '#5B41C4' },
  processing: { bg: '#FFF8EB', text: '#B45309' },
  shipped:    { bg: '#F3EBFF', text: '#7C3AED' },
  delivered:  { bg: '#EBFFF0', text: '#166534' },
  cancelled:  { bg: '#FFEBEB', text: '#B91C1C' },
};
const STATUS_OPTIONS = ['placed','confirmed','processing','shipped','delivered','cancelled'];
const CATEGORIES = ['Paintings','Pottery','Jewelry','Textiles','Woodwork','Metalwork','Leather','Glass','Paper','Other'];

/* ── Image upload zone ── */
function ImageUploadZone({ images, onChange }) {
  const inputRef  = useRef(null);
  const [dragging, setDragging] = useState(false);

  const addFiles = (files) => {
    const valid = Array.from(files).filter(f => f.type.startsWith('image/'));
    const total = images.length + valid.length;
    if (total > 4) { toast.error('Max 4 images allowed'); return; }
    onChange([...images, ...valid.slice(0, 4 - images.length)]);
  };

  const remove = (i) => onChange(images.filter((_, idx) => idx !== i));

  return (
    <div>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
        style={{
          border: `2px dashed ${dragging ? 'var(--clay)' : '#D5CAC0'}`,
          background: dragging ? 'rgba(196,98,45,.04)' : 'var(--parch)',
          padding: '28px 20px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all .2s',
          marginBottom: 12,
        }}
      >
        <ImagePlus size={28} style={{ color: 'var(--stone)', margin: '0 auto 8px' }} />
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize: '.85rem', color: 'var(--stone)', marginBottom: 4 }}>
          Click or drag images here
        </p>
        <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize: '.72rem', color: '#B0A090' }}>
          JPG, PNG, WEBP · Max 5MB each · Up to 4 images
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: 'none' }}
          onChange={e => addFiles(e.target.files)}
        />
      </div>

      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {images.map((img, i) => (
            <div key={i} style={{ position: 'relative', aspectRatio: '1', background: '#f0e8de' }}>
              <img
                src={typeof img === 'string' ? img : URL.createObjectURL(img)}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  background: 'rgba(26,18,8,.75)', border: 'none',
                  color: 'white', borderRadius: '50%',
                  width: 22, height: 22, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={11} />
              </button>
              {i === 0 && (
                <span style={{
                  position: 'absolute', bottom: 4, left: 4,
                  background: 'var(--clay)', color: 'white',
                  fontSize: '.58rem', fontWeight: 700, letterSpacing: '.1em',
                  padding: '2px 6px', textTransform: 'uppercase',
                }}>Main</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Main component ── */
export default function ArtistDashboard() {
  const { user, artistProfile, socket } = useAuth();
  const [activeTab,  setActiveTab]  = useState('overview');
  const [stats,      setStats]      = useState(null);
  const [products,   setProducts]   = useState([]);
  const [orders,     setOrders]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const emptyForm = {
    name: '', description: '', price: '', comparePrice: '',
    category: 'Pottery', stock: '', tags: '',
    specifications: { material: '', dimensions: '', weight: '', color: '', customizable: false },
    imageFiles: [],
    existingImages: [],
  };
  const [form, setForm] = useState(emptyForm);

  /* ── fetch ── */
  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('new-order', (data) => {
      setNotifications(p => [{ ...data, id: Date.now(), read: false }, ...p]);
      toast.success(`New order received! #${data.orderNumber}`);
      fetchOrders();
    });
    return () => socket.off('new-order');
  }, [socket]);

  const fetchAll = async () => {
    try { await Promise.all([fetchStats(), fetchProducts(), fetchOrders()]); }
    finally { setLoading(false); }
  };

  const fetchStats    = async () => { const { data } = await api.get('/artists/dashboard/stats'); setStats(data); };
  const fetchProducts = async () => { const { data } = await api.get('/products/artist/my-products'); setProducts(Array.isArray(data) ? data : []); };
  const fetchOrders   = async () => { const { data } = await api.get('/orders/artist-orders'); setOrders(Array.isArray(data) ? data : []); };

  /* ── form helpers ── */
  const resetForm = () => { setForm(emptyForm); setEditingId(null); setShowForm(false); };

  const startEdit = (p) => {
    setForm({
      name: p.name, description: p.description,
      price: p.price, comparePrice: p.comparePrice || '',
      category: p.category, stock: p.stock,
      tags: p.tags?.join(', ') || '',
      specifications: { ...p.specifications },
      imageFiles:     [],
      existingImages: p.images || [],
    });
    setEditingId(p._id);
    setShowForm(true);
    setActiveTab('products');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /* ── submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.imageFiles.length === 0 && form.existingImages.length === 0) {
      toast.error('Please add at least one image'); return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name',         form.name);
      fd.append('description',  form.description);
      fd.append('price',        form.price);
      fd.append('comparePrice', form.comparePrice || 0);
      fd.append('category',     form.category);
      fd.append('stock',        form.stock);
      fd.append('tags',         form.tags);
      fd.append('specifications', JSON.stringify(form.specifications));

      form.imageFiles.forEach(f => fd.append('images', f));

      if (editingId) {
        await api.put(`/products/${editingId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated!');
      } else {
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product listed successfully!');
      }

      await fetchProducts();
      await fetchStats();
      resetForm();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── delete ── */
  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts(); fetchStats();
    } catch { toast.error('Failed to delete'); }
  };

  /* ── order status ── */
  const handleOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success('Order updated!');
      fetchOrders();
    } catch { toast.error('Failed to update'); }
  };

  /* ─────── STYLES ─────── */
  const S = {
    page:    { fontFamily:"'DM Sans',sans-serif", maxWidth:1280, margin:'0 auto', padding:'32px 40px', color:'var(--ink)' },
    card:    { background:'white', border:'1px solid #E8DDD4', padding:20 },
    input:   { width:'100%', background:'var(--parch)', border:'1.5px solid #D5CAC0', padding:'11px 14px', fontFamily:"'DM Sans',sans-serif", fontSize:'.9rem', color:'var(--ink)', outline:'none', borderRadius:0, boxSizing:'border-box', transition:'border-color .2s' },
    label:   { fontFamily:"'DM Sans',sans-serif", fontSize:'.65rem', fontWeight:600, letterSpacing:'.17em', textTransform:'uppercase', color:'var(--stone)', display:'block', marginBottom:6 },
    btnPrim: { display:'inline-flex', alignItems:'center', gap:8, background:'var(--ink)', color:'var(--cream)', fontFamily:"'DM Sans',sans-serif", fontSize:'.78rem', fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', padding:'12px 24px', border:'1.5px solid var(--ink)', cursor:'pointer', transition:'background .2s', borderRadius:0 },
    btnOut:  { display:'inline-flex', alignItems:'center', gap:8, background:'transparent', color:'var(--ink)', fontFamily:"'DM Sans',sans-serif", fontSize:'.78rem', fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', padding:'11px 24px', border:'1.5px solid var(--ink)', cursor:'pointer', transition:'all .2s', borderRadius:0 },
  };

  if (loading) return (
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'40px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        {[...Array(4)].map((_,i) => <div key={i} style={{ height:112, background:'linear-gradient(90deg,#F7F0E6 25%,#EDE3D5 50%,#F7F0E6 75%)', backgroundSize:'200% 100%', animation:'skp 1.4s ease-in-out infinite' }}/>)}
      </div>
      <style>{`@keyframes skp{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
    </div>
  );

  return (
    <>
      <style>{`
        :root{--ink:#1A1208;--clay:#C4622D;--clay-lt:#D97B4A;--parch:#F7F0E6;--parch-dk:#EDE3D5;--stone:#8C7B6B;--cream:#FDFAF5;}
        .dash-input:focus{border-color:var(--clay)!important;background:white!important;}
        .dash-btn-p:hover{background:var(--clay)!important;border-color:var(--clay)!important;}
        .dash-btn-o:hover{background:var(--ink)!important;color:var(--cream)!important;}
        .dash-tab{font-family:'DM Sans',sans-serif;font-size:.82rem;font-weight:500;padding:0 4px 14px;border-bottom:2px solid transparent;background:none;border-top:none;border-left:none;border-right:none;cursor:pointer;color:#8C7B6B;display:flex;align-items:center;gap:7px;transition:color .2s;}
        .dash-tab.active{border-bottom-color:var(--clay);color:var(--clay);font-weight:600;}
        .dash-tab:hover:not(.active){color:var(--ink);}
        .prod-card{border:1px solid #E8DDD4;background:white;overflow:hidden;transition:box-shadow .2s;}
        .prod-card:hover{box-shadow:0 4px 16px rgba(26,18,8,.08);}
        select.dash-input{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%238C7B6B' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;padding-right:36px;}
      `}</style>

      <div style={S.page}>

        {/* ── Header ── */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:32, flexWrap:'wrap', gap:16 }}>
          <div>
            <p style={{ ...S.label, marginBottom:6 }}>Dashboard</p>
            <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'2.2rem', fontWeight:600, color:'var(--ink)', lineHeight:1.1 }}>
              {artistProfile?.brandName || user?.name}
            </h1>
          </div>
          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            {notifications.filter(n=>!n.read).length > 0 && (
              <div style={{ position:'relative' }}>
                <Bell size={18} style={{ color:'var(--clay)' }}/>
                <span style={{ position:'absolute', top:-6, right:-6, background:'#ef4444', color:'white', fontSize:'.6rem', width:16, height:16, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>
                  {notifications.filter(n=>!n.read).length}
                </span>
              </div>
            )}
            <Link
              to={`/artist/${artistProfile?._id}`}
              style={{ ...S.btnOut, fontSize:'.74rem', padding:'9px 18px' }}
              className="dash-btn-o"
            >
              <Eye size={13}/> View Profile
            </Link>
          </div>
        </div>

        {/* ── Stats ── */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:32 }}>
            {[
              { icon:Package,   label:'Total Products', value: stats.totalProducts },
              { icon:ShoppingBag, label:'Total Sales',  value: stats.totalSales },
              { icon:TrendingUp, label:'Revenue',        value: `₹${(stats.totalRevenue||0).toLocaleString()}` },
              { icon:Star,      label:'Avg Rating',     value: stats.averageRating > 0 ? `${Number(stats.averageRating).toFixed(1)}★` : '—' },
            ].map(({ icon:Icon, label, value }) => (
              <div key={label} style={S.card}>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                  <div style={{ width:34, height:34, background:'rgba(196,98,45,.08)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Icon size={15} style={{ color:'var(--clay)' }}/>
                  </div>
                  <span style={S.label}>{label}</span>
                </div>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'2.4rem', fontWeight:600, color:'var(--ink)', lineHeight:1 }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Tabs ── */}
        <div style={{ display:'flex', gap:28, borderBottom:'1px solid #E8DDD4', marginBottom:32 }}>
          {[
            { id:'overview', label:'Overview', icon:TrendingUp },
            { id:'products', label:'Products',  icon:Package },
            { id:'orders',   label:'Orders',    icon:ShoppingBag },
          ].map(({ id, label, icon:Icon }) => (
            <button key={id} onClick={()=>setActiveTab(id)} className={`dash-tab ${activeTab===id?'active':''}`}>
              <Icon size={14}/> {label}
              {id==='orders' && orders.filter(o=>o.orderStatus==='placed').length > 0 && (
                <span style={{ background:'#ef4444', color:'white', fontSize:'.6rem', padding:'1px 6px', borderRadius:99, fontWeight:700 }}>
                  {orders.filter(o=>o.orderStatus==='placed').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ════════════ OVERVIEW ════════════ */}
        {activeTab === 'overview' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div style={S.card}>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.2rem', fontWeight:600, marginBottom:16 }}>Recent Orders</p>
              {orders.slice(0,5).map(o => (
                <div key={o._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid #F0E8E0' }}>
                  <div>
                    <p style={{ fontSize:'.85rem', fontWeight:600 }}>#{o.orderNumber}</p>
                    <p style={{ fontSize:'.75rem', color:'var(--stone)' }}>{o.user?.name}</p>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <p style={{ fontSize:'.88rem', fontWeight:600 }}>₹{o.total?.toLocaleString()}</p>
                    <span style={{ fontSize:'.7rem', padding:'2px 8px', background:STATUS_COLORS[o.orderStatus]?.bg, color:STATUS_COLORS[o.orderStatus]?.text }}>
                      {o.orderStatus}
                    </span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <p style={{ fontSize:'.85rem', color:'var(--stone)' }}>No orders yet</p>}
            </div>

            <div style={S.card}>
              <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.2rem', fontWeight:600, marginBottom:16 }}>Stock Alerts</p>
              {products.filter(p=>p.stock<=3).map(p => (
                <div key={p._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid #F0E8E0' }}>
                  <p style={{ fontSize:'.85rem', flex:1 }}>{p.name}</p>
                  <span style={{ fontSize:'.72rem', padding:'2px 8px', background: p.stock===0?'#FFEBEB':'#FFF8EB', color: p.stock===0?'#B91C1C':'#B45309' }}>
                    {p.stock===0 ? 'Out of stock' : `${p.stock} left`}
                  </span>
                </div>
              ))}
              {products.filter(p=>p.stock<=3).length===0 && (
                <p style={{ fontSize:'.85rem', color:'var(--stone)' }}>All products well stocked ✓</p>
              )}
            </div>
          </div>
        )}

        {/* ════════════ PRODUCTS ════════════ */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.5rem', fontWeight:600 }}>
                My Products ({products.length})
              </h2>
              <button
                onClick={() => { resetForm(); setShowForm(true); }}
                style={S.btnPrim}
                className="dash-btn-p"
              >
                <Plus size={14}/> Add Product
              </button>
            </div>

            {/* ── Product Form ── */}
            {showForm && (
              <div style={{ ...S.card, marginBottom:28, padding:28 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                  <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', fontWeight:600 }}>
                    {editingId ? 'Edit Product' : 'Add New Product'}
                  </p>
                  <button onClick={resetForm} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--stone)' }}>
                    <X size={18}/>
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                    <div>
                      <label style={S.label}>Product Name *</label>
                      <input className="dash-input" style={S.input} value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
                    </div>
                    <div>
                      <label style={S.label}>Category *</label>
                      <select className="dash-input" style={S.input} value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                        {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <label style={S.label}>Description *</label>
                      <textarea className="dash-input" style={{ ...S.input, minHeight:88, resize:'vertical' }} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required/>
                    </div>
                    <div>
                      <label style={S.label}>Price (₹) *</label>
                      <input type="number" min="0" className="dash-input" style={S.input} value={form.price} onChange={e=>setForm({...form,price:e.target.value})} required/>
                    </div>
                    <div>
                      <label style={S.label}>Compare Price (₹) <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>optional</span></label>
                      <input type="number" min="0" className="dash-input" style={S.input} value={form.comparePrice} onChange={e=>setForm({...form,comparePrice:e.target.value})}/>
                    </div>
                    <div>
                      <label style={S.label}>Stock Qty *</label>
                      <input type="number" min="0" className="dash-input" style={S.input} value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} required/>
                    </div>
                    <div>
                      <label style={S.label}>Tags <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0 }}>comma separated</span></label>
                      <input className="dash-input" style={S.input} placeholder="handmade, pottery, blue" value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})}/>
                    </div>
                  </div>

                  {/* Specs */}
                  <div style={{ borderTop:'1px solid #E8DDD4', paddingTop:16, marginBottom:20 }}>
                    <p style={{ ...S.label, marginBottom:12 }}>Specifications</p>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
                      {['material','dimensions','weight','color'].map(f => (
                        <div key={f}>
                          <label style={{ ...S.label, textTransform:'capitalize' }}>{f}</label>
                          <input className="dash-input" style={{ ...S.input, padding:'9px 12px' }}
                            value={form.specifications[f]||''}
                            onChange={e=>setForm({...form,specifications:{...form.specifications,[f]:e.target.value}})}/>
                        </div>
                      ))}
                    </div>
                    <label style={{ display:'flex', alignItems:'center', gap:8, marginTop:12, cursor:'pointer' }}>
                      <input type="checkbox" checked={form.specifications.customizable}
                        onChange={e=>setForm({...form,specifications:{...form.specifications,customizable:e.target.checked}})}/>
                      <span style={{ fontSize:'.85rem', color:'var(--stone)' }}>Available for customization</span>
                    </label>
                  </div>

                  {/* Image upload */}
                  <div style={{ borderTop:'1px solid #E8DDD4', paddingTop:16, marginBottom:24 }}>
                    <p style={{ ...S.label, marginBottom:12 }}>
                      Product Images *
                      <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, marginLeft:6 }}>
                        {editingId && form.existingImages.length > 0 ? '(upload new to replace existing)' : ''}
                      </span>
                    </p>

                    {editingId && form.existingImages.length > 0 && form.imageFiles.length === 0 && (
                      <div style={{ marginBottom:12 }}>
                        <p style={{ fontSize:'.75rem', color:'var(--stone)', marginBottom:8 }}>Current images:</p>
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:12 }}>
                          {form.existingImages.map((url,i) => (
                            <div key={i} style={{ aspectRatio:'1', overflow:'hidden' }}>
                              <img src={url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <ImageUploadZone
                      images={form.imageFiles}
                      onChange={files => setForm({...form, imageFiles: files})}
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:12 }}>
                    <button
                      type="submit"
                      disabled={submitting}
                      style={{ ...S.btnPrim, opacity: submitting ? .6 : 1 }}
                      className="dash-btn-p"
                    >
                      {submitting ? (
                        <>
                          <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'white', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/>
                          {editingId ? 'Saving…' : 'Listing…'}
                        </>
                      ) : (
                        <>{editingId ? 'Update Product' : 'List Product'}</>
                      )}
                    </button>
                    <button type="button" onClick={resetForm} style={S.btnOut} className="dash-btn-o">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* Products grid */}
            {products.length === 0 ? (
              <div style={{ textAlign:'center', padding:'64px 24px', background:'var(--parch)', border:'1px solid #E8DDD4' }}>
                <Package size={40} style={{ color:'#D5CAC0', margin:'0 auto 12px' }}/>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.5rem', color:'var(--stone)', marginBottom:20 }}>No products yet</p>
                <button onClick={()=>setShowForm(true)} style={S.btnPrim} className="dash-btn-p">
                  <Plus size={14}/> Add Your First Product
                </button>
              </div>
            ) : (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                {products.map(p => (
                  <div key={p._id} className="prod-card">
                    <div style={{ height:160, background:'var(--parch)', overflow:'hidden' }}>
                      <img
                        src={p.images?.[0] || 'https://placehold.co/400x300/F7F0E6/8C7B6B?text=No+Image'}
                        alt={p.name}
                        style={{ width:'100%', height:'100%', objectFit:'cover' }}
                      />
                    </div>
                    <div style={{ padding:16 }}>
                      <p style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:'.9rem', marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</p>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', fontWeight:600 }}>₹{p.price?.toLocaleString()}</p>
                        <span style={{ fontSize:'.7rem', padding:'3px 8px', background: p.stock===0?'#FFEBEB': p.stock<=3?'#FFF8EB':'#EBFFF0', color: p.stock===0?'#B91C1C': p.stock<=3?'#B45309':'#166534' }}>
                          {p.stock===0 ? 'Out of stock' : `${p.stock} in stock`}
                        </span>
                      </div>
                      <p style={{ fontSize:'.75rem', color:'var(--stone)', marginBottom:12 }}>{p.sold || 0} sold</p>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                        <button onClick={()=>startEdit(p)} style={{ ...S.btnOut, justifyContent:'center', padding:'8px 12px', fontSize:'.73rem' }} className="dash-btn-o">
                          <Edit2 size={12}/> Edit
                        </button>
                        <button onClick={()=>handleDelete(p._id)} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'transparent', border:'1px solid #FECACA', color:'#B91C1C', fontFamily:"'DM Sans',sans-serif", fontSize:'.73rem', fontWeight:600, letterSpacing:'.08em', textTransform:'uppercase', padding:'8px 12px', cursor:'pointer', transition:'background .2s' }}>
                          <Trash2 size={12}/> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════ ORDERS ════════════ */}
        {activeTab === 'orders' && (
          <div>
            <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.5rem', fontWeight:600, marginBottom:24 }}>
              Orders ({orders.length})
            </h2>
            {orders.length === 0 ? (
              <div style={{ textAlign:'center', padding:'64px', background:'var(--parch)', border:'1px solid #E8DDD4' }}>
                <ShoppingBag size={40} style={{ color:'#D5CAC0', margin:'0 auto 12px' }}/>
                <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.4rem', color:'var(--stone)' }}>No orders yet</p>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                {orders.map(o => (
                  <div key={o._id} style={S.card}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:16 }}>
                      <div>
                        <p style={{ fontWeight:700, marginBottom:3 }}>#{o.orderNumber}</p>
                        <p style={{ fontSize:'.82rem', color:'var(--stone)' }}>{o.user?.name} · {o.user?.email}</p>
                        <p style={{ fontSize:'.75rem', color:'#B0A090', marginTop:2 }}>{new Date(o.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.4rem', fontWeight:600 }}>₹{o.total?.toLocaleString()}</p>
                        <select
                          value={o.orderStatus}
                          onChange={e=>handleOrderStatus(o._id, e.target.value)}
                          style={{ fontSize:'.75rem', padding:'6px 10px', border:'none', outline:'none', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600, background:STATUS_COLORS[o.orderStatus]?.bg, color:STATUS_COLORS[o.orderStatus]?.text }}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s} style={{ background:'white', color:'#1A1208' }}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
                        </select>
                      </div>
                    </div>

                    <div style={{ borderTop:'1px solid #F0E8E0', paddingTop:12 }}>
                      {o.items?.map((item,i) => (
                        <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:8 }}>
                          <img src={item.image||'https://placehold.co/40/F7F0E6/8C7B6B?text=P'} alt="" style={{ width:44, height:44, objectFit:'cover' }}/>
                          <div>
                            <p style={{ fontSize:'.85rem', fontWeight:500 }}>{item.name}</p>
                            <p style={{ fontSize:'.75rem', color:'var(--stone)' }}>Qty: {item.quantity} × ₹{item.price?.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ borderTop:'1px solid #F0E8E0', paddingTop:10, marginTop:4 }}>
                      <p style={{ fontSize:'.75rem', color:'var(--stone)' }}>
                        Ship to: {o.shippingAddress?.name}, {o.shippingAddress?.city}, {o.shippingAddress?.state}
                        {o.shippingAddress?.phone && ` · ${o.shippingAddress.phone}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </>
  );
}