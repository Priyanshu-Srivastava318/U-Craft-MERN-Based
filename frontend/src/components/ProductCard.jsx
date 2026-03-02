import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../utils/api'; // ✅ api.js use karo, axios nahi — token auto-attach hoga

export default function ProductCard({ product, wishlistedIds = [] }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [imageIdx, setImageIdx] = useState(0);
  // ✅ Parent se wishlistedIds prop milega — initial state sahi hogi
  const [wishlisted, setWishlisted] = useState(() => wishlistedIds.includes(product._id));
  const [adding, setAdding] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  const handleAddToCart = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to add to cart'); return; }
    if (user.role === 'artist') { toast.error('Artists cannot purchase'); return; }
    setAdding(true);
    await addToCart(product._id);
    setAdding(false);
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login'); return; }
    if (wishlistLoading) return;

    setWishlistLoading(true);
    try {
      if (wishlisted) {
        // ✅ DELETE — remove from wishlist
        await api.delete(`/users/wishlist/${product._id}`);
        setWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        // ✅ POST — add to wishlist (token auto-attached via api.js interceptor)
        await api.post(`/users/wishlist/${product._id}`);
        setWishlisted(true);
        toast.success('Added to wishlist ♡');
      }
    } catch (err) {
      console.error('Wishlist error:', err);
      toast.error('Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const discount = product.comparePrice > product.price
    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
    : 0;

  return (
    <Link to={`/product/${product._id}`} className="group block">
      <div className="card overflow-hidden">
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
          {product.images?.length > 1 && (
            <img
              src={product.images[imageIdx === 0 ? 1 : 0] || product.images[0]}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            />
          )}
          <img
            src={product.images?.[0] || 'https://placehold.co/400x500/f5ede0/8a6340?text=Craft'}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {discount > 0 && (
              <span className="bg-terracotta-500 text-white text-xs font-body font-bold px-2 py-1">
                -{discount}%
              </span>
            )}
            {product.stock === 0 && (
              <span className="bg-stone-700 text-white text-xs font-body px-2 py-1">SOLD OUT</span>
            )}
          </div>

          {/* Wishlist button */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-10 group-hover:translate-x-0 transition-transform duration-300">
            <button
              onClick={handleWishlist}
              disabled={wishlistLoading}
              className={`w-9 h-9 flex items-center justify-center bg-white shadow-md transition-colors ${
                wishlisted ? 'text-red-500' : 'text-stone-600 hover:text-red-500'
              } ${wishlistLoading ? 'opacity-60' : ''}`}
              title={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={16} fill={wishlisted ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Add to cart */}
          {product.stock > 0 && (
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="absolute bottom-0 left-0 right-0 bg-ink-900 text-white font-body text-xs uppercase tracking-widest py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-2 hover:bg-craft-600 disabled:opacity-60"
            >
              <ShoppingBag size={14} />
              {adding ? 'Adding...' : 'Add to Cart'}
            </button>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          <p className="label-sm mb-1">{product.artist?.brandName || 'Artisan'}</p>
          <h3 className="font-body font-medium text-ink-900 text-sm line-clamp-2 leading-snug">{product.name}</h3>
          <div className="flex items-center gap-2 mt-2">
            {product.averageRating > 0 && (
              <div className="flex items-center gap-1">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="font-body text-xs text-stone-600">{Number(product.averageRating).toFixed(1)}</span>
                <span className="font-body text-xs text-stone-400">({product.totalReviews})</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="font-display text-lg text-ink-900">₹{product.price?.toLocaleString()}</span>
            {product.comparePrice > product.price && (
              <span className="font-body text-sm text-stone-400 line-through">₹{product.comparePrice?.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}