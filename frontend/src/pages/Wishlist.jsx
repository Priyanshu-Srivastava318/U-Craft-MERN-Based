import { useState, useEffect, useCallback } from 'react';
import { Heart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useAuth();

  const fetchWishlist = useCallback(async () => {
    try {
      const { data } = await api.get('/users/wishlist');
      setItems(Array.isArray(data) ? data : []);
    } catch {
      console.error('Failed to fetch wishlist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWishlist(); }, [fetchWishlist]);

  // Realtime wishlist updates via socket
  useEffect(() => {
    if (!socket) return;
    socket.on('wishlist-updated', (updatedWishlist) => {
      setItems(Array.isArray(updatedWishlist) ? updatedWishlist : []);
    });
    return () => socket.off('wishlist-updated');
  }, [socket]);

  const removeFromWishlist = async (productId) => {
    try {
      await api.delete(`/users/wishlist/${productId}`);
      setItems(prev => prev.filter(p => p._id !== productId));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove');
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="h-8 skeleton w-48 mb-8"/>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {[...Array(4)].map((_,i) => <div key={i} className="aspect-[3/4] skeleton"/>)}
      </div>
    </div>
  );

  return (
    <div className="page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="section-title">My Wishlist</h1>
        {items.length > 0 && (
          <span className="label-sm">{items.length} item{items.length!==1?'s':''}</span>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24">
          <Heart size={52} className="text-stone-200 mx-auto mb-5"/>
          <p className="font-display text-2xl text-stone-400 mb-2">Your wishlist is empty</p>
          <p className="font-body text-sm text-stone-400 mb-8">Save items you love — find them here later</p>
          <Link to="/shop" className="btn-primary">Explore Shop</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map(product => (
            <div key={product._id} className="group relative bg-white border border-stone-200 hover:border-stone-300 transition-all">
              <Link to={`/product/${product._id}`}>
                <div className="aspect-[3/4] overflow-hidden bg-stone-100">
                  <img
                    src={product.images?.[0] || 'https://placehold.co/300x400/f5ede0/8a6340?text=Craft'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-3">
                  <p className="label-sm mb-1">{product.artist?.brandName}</p>
                  <p className="font-body text-sm text-ink-900 line-clamp-1 font-medium">{product.name}</p>
                  <p className="font-display text-base text-craft-600 mt-1">₹{product.price?.toLocaleString()}</p>
                </div>
              </Link>

              {/* Remove button */}
              <button
                onClick={() => removeFromWishlist(product._id)}
                className="absolute top-2 right-2 w-8 h-8 bg-white/90 hover:bg-red-50 flex items-center justify-center transition-colors shadow-sm border border-stone-200 hover:border-red-300"
                title="Remove from wishlist"
              >
                <Trash2 size={14} className="text-stone-400 hover:text-red-500"/>
              </button>

              {/* Quick add to cart / buy now at bottom */}
              <div className="px-3 pb-3">
                <Link
                  to={`/product/${product._id}`}
                  className="block w-full text-center font-body text-xs font-semibold uppercase tracking-wider py-2 bg-ink-900 text-white hover:bg-craft-500 transition-colors"
                  style={{background:'#1A1208',color:'white',textDecoration:'none'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#C4622D'}
                  onMouseLeave={e=>e.currentTarget.style.background='#1A1208'}
                >
                  View & Buy
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}