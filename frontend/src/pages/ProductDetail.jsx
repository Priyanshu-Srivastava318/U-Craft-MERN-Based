import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, ChevronLeft, ChevronRight, ArrowRight, Zap, MessageCircle } from 'lucide-react';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function Stars({ rating, onRate, readonly, size = 18 }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i}
          onClick={() => !readonly && onRate?.(i)}
          onMouseEnter={() => !readonly && setHovered(i)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{ fontSize:size, cursor:readonly?'default':'pointer', color: i<=(hovered||rating)?'#C4622D':'#E0D5C8', transition:'color 0.15s' }}>
          ★
        </span>
      ))}
    </div>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product,         setProduct]         = useState(null);
  const [reviews,         setReviews]         = useState([]);
  const [loading,         setLoading]         = useState(true);
  const [imgIdx,          setImgIdx]          = useState(0);
  const [qty,             setQty]             = useState(1);
  const [adding,          setAdding]          = useState(false);
  const [buyingNow,       setBuyingNow]       = useState(false);
  const [reviewForm,      setReviewForm]      = useState({ rating:5, comment:'' });
  const [submitting,      setSubmitting]      = useState(false);
  const [wishlisted,      setWishlisted]      = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistChecked, setWishlistChecked] = useState(false);

  const { addToCart, isInCart, setCartOpen } = useCart();
  const { user } = useAuth();
  const inCart = isInCart(id);

  useEffect(() => { fetchProduct(); }, [id]);

  useEffect(() => {
    if (!user || user.role !== 'user') { setWishlistChecked(true); return; }
    setWishlistChecked(false);
    api.get('/users/wishlist')
      .then(({ data }) => {
        const ids = Array.isArray(data) ? data.map(p => String(p._id)) : [];
        setWishlisted(ids.includes(String(id)));
      })
      .catch(() => {})
      .finally(() => setWishlistChecked(true));
  }, [id, user?._id]);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const [pRes, rRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/reviews/product/${id}`).catch(() => ({ data:[] }))
      ]);
      setProduct(pRes.data);
      setReviews(Array.isArray(rRes.data) ? rRes.data : []);
    } catch { toast.error('Product not found'); }
    finally { setLoading(false); }
  };

  const handleAddToCart = async () => {
    if (!user) { toast.error('Please login'); navigate('/login'); return; }
    if (user.role === 'artist') { toast.error('Artists cannot purchase'); return; }
    if (inCart) { setCartOpen(true); return; }
    setAdding(true);
    await addToCart(product._id, qty);
    setAdding(false);
  };

  const handleBuyNow = async () => {
    if (!user) { toast.error('Please login'); navigate('/login', { state:{ from:{ pathname:`/product/${id}` } } }); return; }
    if (user.role === 'artist') { toast.error('Artists cannot purchase'); return; }
    setBuyingNow(true);
    try {
      if (!inCart) await addToCart(product._id, qty);
      navigate('/checkout');
    } catch { toast.error('Something went wrong'); }
    finally { setBuyingNow(false); }
  };

  const handleWishlist = async () => {
    if (!user) { toast.error('Please login'); navigate('/login'); return; }
    if (wishlistLoading) return;
    setWishlistLoading(true);
    try {
      if (wishlisted) {
        await api.delete(`/users/wishlist/${id}`);
        setWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await api.post(`/users/wishlist/${id}`);
        setWishlisted(true);
        toast.success('Added to wishlist ♡');
      }
    } catch { toast.error('Failed to update wishlist'); }
    finally { setWishlistLoading(false); }
  };

  // ✅ Custom order — chat open with pre-filled message
  const handleCustomOrder = () => {
    if (!user) { navigate('/login'); return; }
    if (user.role === 'artist') { toast.error('Artists cannot place orders'); return; }
    // Navigate to chat with artist, pre-fill message via query param
    const msg = encodeURIComponent(`Hi! I'm interested in a custom version of "${product.name}". Can we discuss the details?`);
    navigate(`/chat/${product.artist?._id}?msg=${msg}`);
  };

  const Spinner = ({ dark }) => (
    <span style={{ width:13, height:13, borderRadius:'50%', display:'inline-block', border: dark?'2px solid rgba(26,18,8,0.2)':'2px solid rgba(255,255,255,0.3)', borderTopColor:dark?'#1A1208':'white', animation:'spin 0.7s linear infinite' }}/>
  );

  if (loading) return (
    <div style={{ maxWidth:1280, margin:'0 auto', padding:'64px 24px' }}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:48 }}>
        <div className="skeleton" style={{ aspectRatio:'1/1' }}/>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="skeleton" style={{ height:32, width:'70%' }}/>
          <div className="skeleton" style={{ height:20, width:'50%' }}/>
          <div className="skeleton" style={{ height:48, width:'40%', marginTop:24 }}/>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div style={{ textAlign:'center', padding:'80px 16px', fontFamily:"'Cormorant Garamond',serif", fontSize:'1.8rem', color:'#8C7B6B' }}>
      Product not found
    </div>
  );

  const isCustomizable = product.specifications?.customizable === true || product.specifications?.customizable === 'true';

  return (
    <div className="page-enter" style={{ maxWidth:1280, margin:'0 auto', padding:'40px 24px' }}>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:48, marginBottom:64 }}>

        {/* Images */}
        <div>
          <div style={{ position:'relative', aspectRatio:'1/1', background:'#F5F0EA', overflow:'hidden', marginBottom:12 }}>
            <img
              src={product.images?.[imgIdx] || 'https://placehold.co/600x600/f5ede0/8a6340?text=Craft'}
              alt={product.name}
              style={{ width:'100%', height:'100%', objectFit:'cover' }}
            />
            {product.images?.length > 1 && (
              <>
                <button onClick={() => setImgIdx(i => Math.max(0,i-1))} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', width:40, height:40, background:'rgba(255,255,255,0.88)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
                  <ChevronLeft size={18}/>
                </button>
                <button onClick={() => setImgIdx(i => Math.min(product.images.length-1,i+1))} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', width:40, height:40, background:'rgba(255,255,255,0.88)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.1)' }}>
                  <ChevronRight size={18}/>
                </button>
              </>
            )}
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {product.images?.map((img,i) => (
              <button key={i} onClick={() => setImgIdx(i)} style={{ width:64, height:64, border:`2px solid ${i===imgIdx?'#C4622D':'#E5DDD5'}`, overflow:'hidden', cursor:'pointer', background:'none', padding:0, transition:'border-color 0.2s' }}>
                <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <Link to={`/artist/${product.artist?._id}`} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.67rem', fontWeight:600, letterSpacing:'0.18em', textTransform:'uppercase', color:'#8C7B6B', textDecoration:'none' }}>
            {product.artist?.brandName}
          </Link>

          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(1.8rem,3vw,2.8rem)', fontWeight:600, color:'#1A1208', margin:'8px 0 12px', lineHeight:1.1 }}>
            {product.name}
          </h1>

          {reviews.length > 0 && (
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <Stars rating={Math.round(product.averageRating||0)} readonly size={16}/>
              <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.85rem', color:'#8C7B6B' }}>
                {Number(product.averageRating||0).toFixed(1)} ({reviews.length} reviews)
              </span>
            </div>
          )}

          <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:20 }}>
            <span style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'2.4rem', color:'#1A1208', lineHeight:1 }}>
              ₹{product.price?.toLocaleString()}
            </span>
            {product.comparePrice > product.price && (
              <>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'1.1rem', color:'#B0A090', textDecoration:'line-through' }}>₹{product.comparePrice?.toLocaleString()}</span>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.85rem', color:'#16a34a', fontWeight:600 }}>{Math.round((1-product.price/product.comparePrice)*100)}% off</span>
              </>
            )}
          </div>

          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.95rem', color:'#6B5E52', lineHeight:1.8, marginBottom:20 }}>
            {product.description}
          </p>

          {product.specifications && Object.values(product.specifications).some(Boolean) && (
            <div style={{ background:'#F7F0E6', border:'1px solid #EDE3D5', padding:16, marginBottom:20 }}>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.67rem', fontWeight:600, letterSpacing:'0.18em', textTransform:'uppercase', color:'#8C7B6B', marginBottom:12 }}>Specifications</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {Object.entries(product.specifications).map(([k,v]) => v && (
                  <div key={k}>
                    <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.75rem', color:'#8C7B6B', textTransform:'capitalize', margin:0 }}>{k}</p>
                    <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.88rem', margin:0 }}>{v===true?'Yes':v===false?'No':v}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {product.stock > 0 ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {!inCart && (
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.67rem', fontWeight:600, letterSpacing:'0.18em', textTransform:'uppercase', color:'#8C7B6B' }}>Qty</span>
                  <div style={{ display:'flex', alignItems:'center', border:'1px solid #D5CAC0' }}>
                    <button onClick={() => setQty(q => Math.max(1,q-1))} style={{ padding:'6px 14px', background:'none', border:'none', cursor:'pointer', fontSize:'1.1rem' }}>−</button>
                    <span style={{ padding:'6px 16px', fontSize:'0.9rem', borderLeft:'1px solid #D5CAC0', borderRight:'1px solid #D5CAC0' }}>{qty}</span>
                    <button onClick={() => setQty(q => Math.min(product.stock,q+1))} style={{ padding:'6px 14px', background:'none', border:'none', cursor:'pointer', fontSize:'1.1rem' }}>+</button>
                  </div>
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.75rem', color:'#8C7B6B' }}>{product.stock} available</span>
                </div>
              )}

              {/* BUY NOW */}
              <button onClick={handleBuyNow} disabled={buyingNow}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'#C4622D', color:'white', border:'none', padding:'16px', fontFamily:"'DM Sans',sans-serif", fontSize:'0.84rem', fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase', cursor:buyingNow?'not-allowed':'pointer', opacity:buyingNow?0.7:1, transition:'background 0.2s' }}
                onMouseEnter={e => { if(!buyingNow) e.currentTarget.style.background='#a8501f'; }}
                onMouseLeave={e => { if(!buyingNow) e.currentTarget.style.background='#C4622D'; }}>
                {buyingNow ? <><Spinner/> Processing…</> : <><Zap size={15} fill="white"/> Buy Now</>}
              </button>

              {/* ADD TO CART + WISHLIST */}
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={handleAddToCart} disabled={adding}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:inCart?'#1A1208':'transparent', color:inCart?'white':'#1A1208', border:'1.5px solid #1A1208', padding:'13px', fontFamily:"'DM Sans',sans-serif", fontSize:'0.78rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', cursor:adding?'not-allowed':'pointer', opacity:adding?0.6:1, transition:'all 0.2s' }}>
                  {adding ? <><Spinner dark/> Adding…</> : inCart ? <><ArrowRight size={15}/> Go to Cart</> : <><ShoppingBag size={15}/> Add to Cart</>}
                </button>

                {user?.role === 'user' && (
                  <button onClick={handleWishlist} disabled={wishlistLoading}
                    title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'13px 16px', border:`1.5px solid ${wishlisted?'#ef4444':'#1A1208'}`, background:wishlisted?'#fef2f2':'transparent', color:wishlisted?'#ef4444':'#1A1208', cursor:wishlistLoading?'not-allowed':'pointer', opacity:wishlistLoading?0.6:1, transition:'all 0.2s', flexShrink:0 }}
                    onMouseEnter={e => { if(!wishlistLoading&&!wishlisted){ e.currentTarget.style.borderColor='#ef4444'; e.currentTarget.style.color='#ef4444'; }}}
                    onMouseLeave={e => { if(!wishlistLoading&&!wishlisted){ e.currentTarget.style.borderColor='#1A1208'; e.currentTarget.style.color='#1A1208'; }}}>
                    {wishlistLoading ? <Spinner dark/> : <Heart size={18} fill={wishlisted?'currentColor':'none'}/>}
                  </button>
                )}
              </div>

              {/* ✅ Request Custom Order — sirf customizable products pe */}
              {isCustomizable && user?.role !== 'artist' && (
                <button onClick={handleCustomOrder}
                  style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'transparent', color:'#C4622D', border:'1.5px solid #C4622D', padding:'13px', fontFamily:"'DM Sans',sans-serif", fontSize:'0.78rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', cursor:'pointer', transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='#FFF5F0'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='transparent'; }}>
                  <MessageCircle size={15}/> Request Custom Order
                </button>
              )}

              {inCart && (
                <p style={{ fontSize:'0.75rem', color:'#C4622D', textAlign:'center', fontFamily:"'DM Sans',sans-serif" }}>
                  ✓ In your cart —{' '}
                  <button onClick={() => setCartOpen(true)} style={{ color:'#C4622D', textDecoration:'underline', background:'none', border:'none', cursor:'pointer', fontSize:'inherit' }}>view cart</button>
                </p>
              )}

              {product.price < 999 && (
                <p style={{ fontSize:'0.73rem', color:'#8C7B6B', textAlign:'center' }}>🚚 Add ₹{(999-product.price).toLocaleString()} more for free shipping</p>
              )}
            </div>
          ) : (
            <div style={{ background:'#F5F0EA', textAlign:'center', padding:'16px', fontFamily:"'DM Sans',sans-serif", color:'#8C7B6B' }}>Out of Stock</div>
          )}

          {/* Artist card */}
          <Link to={`/artist/${product.artist?._id}`}
            style={{ display:'flex', alignItems:'center', gap:12, padding:16, border:'1px solid #EDE3D5', marginTop:32, textDecoration:'none', transition:'border-color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor='#C4622D'}
            onMouseLeave={e => e.currentTarget.style.borderColor='#EDE3D5'}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:'#F7F0E6', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Cormorant Garamond',serif", color:'#C4622D', fontSize:'1.4rem', fontWeight:700, flexShrink:0 }}>
              {product.artist?.brandName?.[0]}
            </div>
            <div>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:'0.9rem', color:'#1A1208', margin:0 }}>{product.artist?.brandName}</p>
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.78rem', color:'#8C7B6B', margin:'2px 0 0' }}>{product.artist?.location} · {product.artist?.specialty}</p>
            </div>
            <span style={{ marginLeft:'auto', fontFamily:"'DM Sans',sans-serif", fontSize:'0.67rem', fontWeight:600, letterSpacing:'0.18em', textTransform:'uppercase', color:'#8C7B6B' }}>View Profile →</span>
          </Link>
        </div>
      </div>

      {/* Reviews */}
      <div style={{ borderTop:'1px solid #EDE3D5', paddingTop:48 }}>
        <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'clamp(1.6rem,2.5vw,2.2rem)', fontWeight:600, color:'#1A1208', marginBottom:32 }}>Reviews</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:48 }}>
          <div>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.3rem', fontWeight:600, marginBottom:16, color:'#1A1208' }}>Write a Review</h3>
            {user?.role === 'user' ? (
              <form onSubmit={handleReview} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div>
                  <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.67rem', fontWeight:600, letterSpacing:'0.18em', textTransform:'uppercase', color:'#8C7B6B', marginBottom:8 }}>Rating</p>
                  <Stars rating={reviewForm.rating} onRate={r => setReviewForm(f => ({...f,rating:r}))}/>
                </div>
                <div>
                  <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.67rem', fontWeight:600, letterSpacing:'0.18em', textTransform:'uppercase', color:'#8C7B6B', marginBottom:8 }}>Review</p>
                  <textarea className="input" style={{ minHeight:96, resize:'none' }} placeholder="Share your experience..." value={reviewForm.comment} onChange={e => setReviewForm(f => ({...f,comment:e.target.value}))} required/>
                </div>
                <button type="submit" disabled={submitting} className="btn-primary" style={{ justifyContent:'center', opacity:submitting?0.6:1 }}>
                  {submitting?'Submitting...':'Submit Review'}
                </button>
              </form>
            ) : (
              <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.88rem', color:'#8C7B6B', background:'#F7F0E6', padding:16, textAlign:'center' }}>
                {!user ? <><Link to="/login" style={{ color:'#C4622D', textDecoration:'underline' }}>Login</Link> to write a review</> : 'Artists cannot review products'}
              </p>
            )}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
            {reviews.length===0 ? (
              <p style={{ fontFamily:"'DM Sans',sans-serif", color:'#8C7B6B' }}>No reviews yet. Be the first!</p>
            ) : reviews.map(r => (
              <div key={r._id} style={{ borderBottom:'1px solid #F0EAE2', paddingBottom:20 }}>
                <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                  <div style={{ width:36, height:36, borderRadius:'50%', background:'#F7F0E6', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:'#C4622D', fontSize:'0.85rem', flexShrink:0 }}>
                    {r.user?.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontWeight:500, fontSize:'0.88rem' }}>{r.user?.name}</span>
                      <Stars rating={r.rating} readonly size={13}/>
                    </div>
                    <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.88rem', color:'#6B5E52', lineHeight:1.7, margin:0 }}>{r.comment}</p>
                    <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.75rem', color:'#8C7B6B', marginTop:4 }}>{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}