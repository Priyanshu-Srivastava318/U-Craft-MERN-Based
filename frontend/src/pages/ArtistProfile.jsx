import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Instagram, Globe, MessageCircle, Edit2, X, Camera } from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import StarRating from '../components/StarRating';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ArtistProfile() {
  const { id }     = useParams();
  const { user, artistProfile } = useAuth();
  const navigate   = useNavigate();

  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [tab,          setTab]          = useState('products');
  const [chatLoading,  setChatLoading]  = useState(false);
  const [showEdit,     setShowEdit]     = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [coverFile,    setCoverFile]    = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [editForm,     setEditForm]     = useState({
    brandName:'', bio:'', location:'', specialty:'', instagram:'', website:'',
  });

  const isOwner = user?.role === 'artist' && String(artistProfile?._id) === String(id);

  const loadData = () => {
    setLoading(true);
    api.get(`/artists/${id}`)
      .then(({ data }) => {
        setData(data);
        setEditForm({
          brandName:  data.artist.brandName              || '',
          bio:        data.artist.bio                    || '',
          location:   data.artist.location               || '',
          specialty:  data.artist.specialty              || '',
          instagram:  data.artist.socialLinks?.instagram || '',
          website:    data.artist.socialLinks?.website   || '',
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [id]);

  const handleMessage = async () => {
    if (!user) { navigate('/login'); return; }
    if (user.role === 'artist') { toast.error('Artists cannot message other artists'); return; }
    setChatLoading(true);
    try { navigate(`/chat/${data.artist._id}`); }
    catch { toast.error('Could not open chat'); }
    finally { setChatLoading(false); }
  };

  const handleCoverChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleEditSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('brandName',   editForm.brandName);
      fd.append('bio',         editForm.bio);
      fd.append('location',    editForm.location);
      fd.append('specialty',   editForm.specialty);
      fd.append('socialLinks', JSON.stringify({
        instagram: editForm.instagram,
        website:   editForm.website,
      }));
      if (coverFile) fd.append('cover', coverFile);

      await api.put('/artists/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Profile updated!');
      setShowEdit(false);
      setCoverFile(null);
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const S = {
    label: { fontFamily:"'DM Sans',sans-serif", fontSize:'.65rem', fontWeight:600, letterSpacing:'.17em', textTransform:'uppercase', color:'#8C7B6B', display:'block', marginBottom:6 },
    input: { width:'100%', background:'#F7F0E6', border:'1.5px solid #D5CAC0', padding:'11px 14px', fontFamily:"'DM Sans',sans-serif", fontSize:'.9rem', color:'#1A1208', outline:'none', boxSizing:'border-box', transition:'border-color .2s', borderRadius:0 },
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-16 space-y-4">
      <div className="h-48 skeleton" />
      <div className="h-8 skeleton w-1/3" />
    </div>
  );

  if (!data) return <div className="text-center py-20 font-display text-2xl">Artist not found</div>;

  const { artist, products = [], reviews = [] } = data;

  const ratingBreakdown = [5,4,3,2,1].map(n => ({
    star: n,
    count: reviews.filter(r => r.rating === n).length,
    pct: reviews.length ? Math.round(reviews.filter(r => r.rating === n).length / reviews.length * 100) : 0,
  }));

  return (
    <div className="page-enter">

      {/* Cover */}
      <div className="h-56 sm:h-72 bg-gradient-to-br from-craft-200 to-stone-300 relative overflow-hidden">
        {artist.coverImage && <img src={artist.coverImage} alt="" className="w-full h-full object-cover"/>}
        <div className="absolute inset-0 bg-ink-900/30"/>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Profile header */}
        <div className="relative -mt-16 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-28 h-28 rounded-full bg-craft-500 flex items-center justify-center font-display text-5xl font-bold text-white border-4 border-white shadow-lg flex-shrink-0">
              {artist.brandName?.[0]}
            </div>
            <div className="sm:mb-2 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-3xl text-ink-900">{artist.brandName}</h1>
                {artist.isVerified && <span className="bg-sage-100 text-sage-600 text-xs font-body px-2 py-1">✓ Verified</span>}
              </div>
              <p className="font-body text-stone-500 mt-1">{artist.user?.name}</p>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-stone-500 font-body">
                {artist.location && <span className="flex items-center gap-1"><MapPin size={13}/> {artist.location}</span>}
                {artist.specialty && <span className="text-craft-600 font-medium">{artist.specialty}</span>}
              </div>
            </div>

            <div className="flex gap-3 sm:mb-2 items-center flex-wrap">
              {artist.socialLinks?.instagram && (
                <a href={artist.socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 border border-stone-300 flex items-center justify-center hover:border-craft-400 hover:text-craft-500 transition-colors">
                  <Instagram size={16}/>
                </a>
              )}
              {artist.socialLinks?.website && (
                <a href={artist.socialLinks.website} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 border border-stone-300 flex items-center justify-center hover:border-craft-400 hover:text-craft-500 transition-colors">
                  <Globe size={16}/>
                </a>
              )}

              {/* Edit button — owner only */}
              {isOwner && (
                <button onClick={() => setShowEdit(true)}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background:'#F7F0E6', color:'#1A1208', border:'1.5px solid #D5CAC0', fontFamily:"'DM Sans',sans-serif", fontSize:'0.78rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', cursor:'pointer', transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='#1A1208'; e.currentTarget.style.color='white'; e.currentTarget.style.borderColor='#1A1208'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='#F7F0E6'; e.currentTarget.style.color='#1A1208'; e.currentTarget.style.borderColor='#D5CAC0'; }}>
                  <Edit2 size={14}/> Edit Profile
                </button>
              )}

              {/* Message button — buyers only */}
              {user?.role !== 'artist' && (
                <button onClick={handleMessage} disabled={chatLoading}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 20px', background:'#1A1208', color:'white', border:'1.5px solid #1A1208', fontFamily:"'DM Sans',sans-serif", fontSize:'0.78rem', fontWeight:600, letterSpacing:'0.12em', textTransform:'uppercase', cursor:chatLoading?'not-allowed':'pointer', opacity:chatLoading?0.7:1, transition:'all 0.2s' }}
                  onMouseEnter={e => { if(!chatLoading){ e.currentTarget.style.background='#C4622D'; e.currentTarget.style.borderColor='#C4622D'; }}}
                  onMouseLeave={e => { e.currentTarget.style.background='#1A1208'; e.currentTarget.style.borderColor='#1A1208'; }}>
                  <MessageCircle size={15}/>
                  {chatLoading ? 'Opening...' : 'Message Artist'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            [products.length, 'Products'],
            [artist.totalSales, 'Items Sold'],
            [artist.averageRating > 0 ? `${Number(artist.averageRating).toFixed(1)}★` : '—', 'Rating'],
          ].map(([val, label]) => (
            <div key={label} className="bg-white border border-stone-200 p-4 text-center">
              <p className="font-display text-2xl text-ink-900">{val}</p>
              <p className="label-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        {artist.bio && (
          <div className="bg-craft-50 border border-craft-100 p-6 mb-8 max-w-2xl">
            <p className="label-sm mb-2">About the Artist</p>
            <p className="font-body text-stone-600 leading-relaxed">{artist.bio}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-stone-200 mb-8 gap-6">
          {['products','reviews'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`font-body font-medium pb-3 border-b-2 capitalize transition-colors ${
                tab===t ? 'border-craft-500 text-craft-600' : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}>
              {t} {t==='reviews' && `(${reviews.length})`}
            </button>
          ))}
        </div>

        {tab === 'products' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 mb-16">
            {products.map(p => <ProductCard key={p._id} product={p}/>)}
            {products.length === 0 && (
              <p className="col-span-4 text-center py-12 font-display text-xl text-stone-400">No products yet</p>
            )}
          </div>
        )}

        {tab === 'reviews' && (
          <div className="mb-16">
            {reviews.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-10 max-w-lg">
                <div className="text-center">
                  <p className="font-display text-6xl text-ink-900">{Number(artist.averageRating).toFixed(1)}</p>
                  <StarRating rating={Math.round(artist.averageRating)} readonly/>
                  <p className="font-body text-sm text-stone-500 mt-1">{reviews.length} reviews</p>
                </div>
                <div className="space-y-2">
                  {ratingBreakdown.map(({ star, count, pct }) => (
                    <div key={star} className="flex items-center gap-2 text-xs font-body">
                      <span className="w-4 text-stone-600">{star}</span>
                      <Star size={11} className="text-amber-400 fill-amber-400"/>
                      <div className="flex-1 h-2 bg-stone-200">
                        <div className="h-full bg-amber-400" style={{ width:`${pct}%` }}/>
                      </div>
                      <span className="w-6 text-stone-500 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-5 max-w-2xl">
              {reviews.length === 0
                ? <p className="font-body text-stone-400">No reviews yet</p>
                : reviews.map(review => (
                  <div key={review._id} className="border-b border-stone-100 pb-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-craft-100 flex items-center justify-center font-bold text-craft-600 text-sm flex-shrink-0">
                        {review.user?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-body font-medium text-sm">{review.user?.name}</p>
                          <StarRating rating={review.rating} readonly size={12}/>
                        </div>
                        <p className="font-body text-sm text-stone-600 mt-1">{review.comment}</p>
                        <p className="font-body text-xs text-stone-400 mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Profile Modal ── */}
      {showEdit && (
        <div style={{ position:'fixed', inset:0, background:'rgba(26,18,8,.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={e => { if(e.target===e.currentTarget) setShowEdit(false); }}>
          <div style={{ background:'white', width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto' }}>

            {/* Modal header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', borderBottom:'1px solid #EDE3D5', position:'sticky', top:0, background:'white', zIndex:1 }}>
              <h2 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.5rem', fontWeight:600, color:'#1A1208' }}>Edit Profile</h2>
              <button onClick={() => setShowEdit(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'#8C7B6B', padding:4 }}>
                <X size={20}/>
              </button>
            </div>

            <form onSubmit={handleEditSave} style={{ padding:24, display:'flex', flexDirection:'column', gap:18 }}>

              {/* Cover Image */}
              <div>
                <label style={S.label}>Cover Image</label>
                <div style={{ position:'relative', height:130, background:'#F7F0E6', overflow:'hidden' }}>
                  {(coverPreview || artist.coverImage) && (
                    <img src={coverPreview || artist.coverImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  )}
                  <label style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', background:'rgba(26,18,8,.28)', transition:'background .2s' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(26,18,8,.45)'}
                    onMouseLeave={e => e.currentTarget.style.background='rgba(26,18,8,.28)'}>
                    <div style={{ textAlign:'center', color:'white' }}>
                      <Camera size={22} style={{ margin:'0 auto 4px' }}/>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'.72rem', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase' }}>
                        {coverPreview ? 'Change Cover' : 'Upload Cover'}
                      </span>
                    </div>
                    <input type="file" accept="image/*" style={{ display:'none' }} onChange={handleCoverChange}/>
                  </label>
                </div>
              </div>

              {/* Brand Name */}
              <div>
                <label style={S.label}>Brand Name *</label>
                <input style={S.input} value={editForm.brandName}
                  onChange={e => setEditForm({...editForm, brandName:e.target.value})}
                  onFocus={e => e.target.style.borderColor='#C4622D'}
                  onBlur={e  => e.target.style.borderColor='#D5CAC0'}
                  required/>
              </div>

              {/* Bio */}
              <div>
                <label style={S.label}>Bio</label>
                <textarea style={{ ...S.input, minHeight:90, resize:'vertical' }}
                  value={editForm.bio}
                  onChange={e => setEditForm({...editForm, bio:e.target.value})}
                  onFocus={e => e.target.style.borderColor='#C4622D'}
                  onBlur={e  => e.target.style.borderColor='#D5CAC0'}
                  placeholder="Tell your story..."/>
              </div>

              {/* Location + Specialty */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={S.label}>Location</label>
                  <input style={S.input} value={editForm.location}
                    onChange={e => setEditForm({...editForm, location:e.target.value})}
                    onFocus={e => e.target.style.borderColor='#C4622D'}
                    onBlur={e  => e.target.style.borderColor='#D5CAC0'}
                    placeholder="e.g. Jaipur, India"/>
                </div>
                <div>
                  <label style={S.label}>Specialty</label>
                  <input style={S.input} value={editForm.specialty}
                    onChange={e => setEditForm({...editForm, specialty:e.target.value})}
                    onFocus={e => e.target.style.borderColor='#C4622D'}
                    onBlur={e  => e.target.style.borderColor='#D5CAC0'}
                    placeholder="e.g. Pottery, Jewelry"/>
                </div>
              </div>

              {/* Social Links */}
              <div style={{ borderTop:'1px solid #EDE3D5', paddingTop:16 }}>
                <p style={{ ...S.label, marginBottom:12 }}>Social Links</p>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <Instagram size={16} style={{ color:'#8C7B6B', flexShrink:0 }}/>
                    <input style={S.input} value={editForm.instagram}
                      onChange={e => setEditForm({...editForm, instagram:e.target.value})}
                      onFocus={e => e.target.style.borderColor='#C4622D'}
                      onBlur={e  => e.target.style.borderColor='#D5CAC0'}
                      placeholder="https://instagram.com/yourhandle"/>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <Globe size={16} style={{ color:'#8C7B6B', flexShrink:0 }}/>
                    <input style={S.input} value={editForm.website}
                      onChange={e => setEditForm({...editForm, website:e.target.value})}
                      onFocus={e => e.target.style.borderColor='#C4622D'}
                      onBlur={e  => e.target.style.borderColor='#D5CAC0'}
                      placeholder="https://yourwebsite.com"/>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display:'flex', gap:10, paddingTop:4 }}>
                <button type="submit" disabled={saving}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'#C4622D', color:'white', border:'1.5px solid #C4622D', padding:'13px', fontFamily:"'DM Sans',sans-serif", fontSize:'.82rem', fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', cursor:saving?'not-allowed':'pointer', opacity:saving?0.7:1, transition:'background .2s' }}
                  onMouseEnter={e => { if(!saving) e.currentTarget.style.background='#a8501f'; }}
                  onMouseLeave={e => { if(!saving) e.currentTarget.style.background='#C4622D'; }}>
                  {saving
                    ? <><span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'white', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/> Saving…</>
                    : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setShowEdit(false)}
                  style={{ padding:'13px 20px', background:'transparent', color:'#1A1208', border:'1.5px solid #D5CAC0', fontFamily:"'DM Sans',sans-serif", fontSize:'.82rem', fontWeight:600, letterSpacing:'.12em', textTransform:'uppercase', cursor:'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}