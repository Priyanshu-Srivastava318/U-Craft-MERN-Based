import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Star, Instagram, Globe, MessageCircle } from 'lucide-react';
import api from '../utils/api';
import ProductCard from '../components/ProductCard';
import StarRating from '../components/StarRating';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ArtistProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('products');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    api.get(`/artists/${id}`)
      .then(({ data }) => setData(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  // ✅ Message Artist button handler
  const handleMessage = async () => {
    if (!user) { navigate('/login'); return; }
    if (user.role === 'artist') {
      toast.error('Artists cannot message other artists');
      return;
    }
    setChatLoading(true);
    try {
      navigate(`/chat/${data.artist._id}`);
    } catch (err) {
      toast.error('Could not open chat');
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-16 space-y-4">
      <div className="h-48 skeleton" />
      <div className="h-8 skeleton w-1/3" />
    </div>
  );

  if (!data) return <div className="text-center py-20 font-display text-2xl">Artist not found</div>;

  const { artist, products = [], reviews = [] } = data;

  const ratingBreakdown = [5, 4, 3, 2, 1].map(n => ({
    star: n,
    count: reviews.filter(r => r.rating === n).length,
    pct: reviews.length ? Math.round(reviews.filter(r => r.rating === n).length / reviews.length * 100) : 0
  }));

  return (
    <div className="page-enter">
      <div className="h-56 sm:h-72 bg-gradient-to-br from-craft-200 to-stone-300 relative overflow-hidden">
        {artist.coverImage && <img src={artist.coverImage} alt="" className="w-full h-full object-cover" />}
        <div className="absolute inset-0 bg-ink-900/30" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                {artist.location && <span className="flex items-center gap-1"><MapPin size={13} /> {artist.location}</span>}
                {artist.specialty && <span className="text-craft-600 font-medium">{artist.specialty}</span>}
              </div>
            </div>

            {/* ✅ Social links + Message button */}
            <div className="flex gap-3 sm:mb-2 items-center flex-wrap">
              {artist.socialLinks?.instagram && (
                <a href={artist.socialLinks.instagram} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 border border-stone-300 flex items-center justify-center hover:border-craft-400 hover:text-craft-500 transition-colors">
                  <Instagram size={16} />
                </a>
              )}
              {artist.socialLinks?.website && (
                <a href={artist.socialLinks.website} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 border border-stone-300 flex items-center justify-center hover:border-craft-400 hover:text-craft-500 transition-colors">
                  <Globe size={16} />
                </a>
              )}

              {/* ✅ Message button — buyers only */}
              {user?.role !== 'artist' && (
                <button
                  onClick={handleMessage}
                  disabled={chatLoading}
                  style={{
                    display:'flex', alignItems:'center', gap:8,
                    padding:'10px 20px',
                    background:'#1A1208', color:'white',
                    border:'1.5px solid #1A1208',
                    fontFamily:"'DM Sans',sans-serif",
                    fontSize:'0.78rem', fontWeight:600,
                    letterSpacing:'0.12em', textTransform:'uppercase',
                    cursor: chatLoading ? 'not-allowed' : 'pointer',
                    opacity: chatLoading ? 0.7 : 1,
                    transition:'all 0.2s',
                  }}
                  onMouseEnter={e => { if (!chatLoading) { e.currentTarget.style.background='#C4622D'; e.currentTarget.style.borderColor='#C4622D'; }}}
                  onMouseLeave={e => { e.currentTarget.style.background='#1A1208'; e.currentTarget.style.borderColor='#1A1208'; }}
                >
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

        <div className="flex border-b border-stone-200 mb-8 gap-6">
          {['products', 'reviews'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`font-body font-medium pb-3 border-b-2 capitalize transition-colors ${
                tab === t ? 'border-craft-500 text-craft-600' : 'border-transparent text-stone-500 hover:text-stone-700'
              }`}>
              {t} {t === 'reviews' && `(${reviews.length})`}
            </button>
          ))}
        </div>

        {tab === 'products' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6 mb-16">
            {products.map(product => <ProductCard key={product._id} product={product} />)}
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
                  <StarRating rating={Math.round(artist.averageRating)} readonly />
                  <p className="font-body text-sm text-stone-500 mt-1">{reviews.length} reviews</p>
                </div>
                <div className="space-y-2">
                  {ratingBreakdown.map(({ star, count, pct }) => (
                    <div key={star} className="flex items-center gap-2 text-xs font-body">
                      <span className="w-4 text-stone-600">{star}</span>
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      <div className="flex-1 h-2 bg-stone-200">
                        <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-6 text-stone-500 text-right">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-5 max-w-2xl">
              {reviews.length === 0 ? (
                <p className="font-body text-stone-400">No reviews yet</p>
              ) : (
                reviews.map(review => (
                  <div key={review._id} className="border-b border-stone-100 pb-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-craft-100 flex items-center justify-center font-bold text-craft-600 text-sm flex-shrink-0">
                        {review.user?.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-body font-medium text-sm">{review.user?.name}</p>
                          <StarRating rating={review.rating} readonly size={12} />
                        </div>
                        <p className="font-body text-sm text-stone-600 mt-1">{review.comment}</p>
                        <p className="font-body text-xs text-stone-400 mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}