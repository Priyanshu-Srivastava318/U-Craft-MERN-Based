import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingBag, Heart, Share2, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import StarRating from '../components/StarRating';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const [productRes, reviewsRes] = await Promise.all([
        axios.get(`/api/products/${id}`),
        axios.get(`/api/reviews/product/${id}`)
      ]);
      setProduct(productRes.data);
      setReviews(reviewsRes.data);
    } catch (err) {
      toast.error('Product not found');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user) { toast.error('Please login to add to cart'); return; }
    if (user.role === 'artist') { toast.error('Artists cannot purchase'); return; }
    await addToCart(product._id, qty);
  };

  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to review'); return; }
    setSubmittingReview(true);
    try {
      await axios.post('/api/reviews', {
        productId: id,
        artistId: product.artist?._id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      toast.success('Review submitted!');
      fetchProduct();
      setReviewForm({ rating: 5, comment: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="aspect-square skeleton" />
        <div className="space-y-4">
          <div className="h-8 skeleton w-3/4" />
          <div className="h-4 skeleton w-1/2" />
          <div className="h-12 skeleton w-1/3 mt-4" />
        </div>
      </div>
    </div>
  );

  if (!product) return <div className="text-center py-20 font-display text-2xl">Product not found</div>;

  return (
    <div className="page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
        {/* Images */}
        <div>
          <div className="relative aspect-square bg-stone-100 overflow-hidden mb-3">
            <img
              src={product.images?.[imgIdx] || 'https://placehold.co/600x600/f5ede0/8a6340?text=Craft'}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.images?.length > 1 && (
              <>
                <button onClick={() => setImgIdx(Math.max(0, imgIdx - 1))}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 flex items-center justify-center hover:bg-white transition-colors shadow">
                  <ChevronLeft size={18} />
                </button>
                <button onClick={() => setImgIdx(Math.min(product.images.length - 1, imgIdx + 1))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 flex items-center justify-center hover:bg-white transition-colors shadow">
                  <ChevronRight size={18} />
                </button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {product.images?.map((img, i) => (
              <button key={i} onClick={() => setImgIdx(i)}
                className={`w-16 h-16 border-2 overflow-hidden transition-all ${i === imgIdx ? 'border-craft-500' : 'border-stone-200'}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <Link to={`/artist/${product.artist?._id}`} className="label-sm hover:text-craft-600 transition-colors">
            {product.artist?.brandName}
          </Link>
          <h1 className="font-display text-3xl md:text-4xl text-ink-900 mt-2 mb-3">{product.name}</h1>

          {product.averageRating > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <StarRating rating={Math.round(product.averageRating)} readonly size={16} />
              <span className="font-body text-sm text-stone-600">{Number(product.averageRating).toFixed(1)} ({product.totalReviews} reviews)</span>
            </div>
          )}

          <div className="flex items-baseline gap-3 mb-6">
            <span className="font-display text-4xl text-ink-900">₹{product.price?.toLocaleString()}</span>
            {product.comparePrice > product.price && (
              <span className="font-body text-lg text-stone-400 line-through">₹{product.comparePrice?.toLocaleString()}</span>
            )}
          </div>

          <p className="font-body text-stone-600 leading-relaxed mb-6">{product.description}</p>

          {/* Specs */}
          {product.specifications && Object.values(product.specifications).some(Boolean) && (
            <div className="bg-stone-50 border border-stone-200 p-4 mb-6">
              <p className="label-sm mb-3">Specifications</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(product.specifications).map(([key, val]) => val && (
                  <div key={key}>
                    <p className="font-body text-xs text-stone-500 capitalize">{key}</p>
                    <p className="font-body text-sm text-ink-800">{val === true ? 'Yes' : val === false ? 'No' : val}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Qty + Add to cart */}
          {product.stock > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <p className="label-sm">Quantity</p>
                <div className="flex items-center border border-stone-300">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-stone-100 transition-colors font-body text-sm">−</button>
                  <span className="px-4 py-2 font-body text-sm border-x border-stone-300">{qty}</span>
                  <button onClick={() => setQty(Math.min(product.stock, qty + 1))} className="px-3 py-2 hover:bg-stone-100 transition-colors font-body text-sm">+</button>
                </div>
                <span className="font-body text-xs text-stone-400">{product.stock} available</span>
              </div>
              <div className="flex gap-3">
                <button onClick={handleAddToCart} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  <ShoppingBag size={16} /> Add to Cart
                </button>
                <button className="btn-outline !px-3">
                  <Heart size={18} />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-stone-100 text-center py-4 font-body text-stone-600">
              Out of Stock — Check back later
            </div>
          )}

          {/* Artist mini card */}
          <Link to={`/artist/${product.artist?._id}`} className="mt-8 flex items-center gap-3 p-4 border border-stone-200 hover:border-craft-400 transition-colors block">
            <div className="w-12 h-12 rounded-full bg-craft-100 flex items-center justify-center font-display text-craft-600 text-lg font-bold">
              {product.artist?.brandName?.[0]}
            </div>
            <div>
              <p className="font-body font-medium text-sm text-ink-900">{product.artist?.brandName}</p>
              <p className="font-body text-xs text-stone-500">{product.artist?.location} · {product.artist?.specialty}</p>
            </div>
            <p className="ml-auto label-sm">View Profile →</p>
          </Link>
        </div>
      </div>

      {/* Reviews */}
      <div className="border-t border-stone-200 pt-12">
        <h2 className="section-title mb-8">Reviews</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Write review */}
          <div className="lg:col-span-1">
            <h3 className="font-display text-xl text-ink-900 mb-4">Write a Review</h3>
            {user && user.role === 'user' ? (
              <form onSubmit={handleReview} className="space-y-4">
                <div>
                  <label className="label-sm block mb-2">Your Rating</label>
                  <StarRating rating={reviewForm.rating} onRate={r => setReviewForm({ ...reviewForm, rating: r })} />
                </div>
                <div>
                  <label className="label-sm block mb-2">Your Review</label>
                  <textarea className="input min-h-24 resize-none" placeholder="Share your experience..."
                    value={reviewForm.comment} onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} required />
                </div>
                <button type="submit" disabled={submittingReview} className="btn-primary w-full disabled:opacity-60">
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <div className="bg-stone-50 p-4 text-center">
                <p className="font-body text-sm text-stone-500">
                  {!user ? <><Link to="/login" className="text-craft-500">Login</Link> to write a review</> : 'Artists cannot write reviews'}
                </p>
              </div>
            )}
          </div>

          {/* Reviews list */}
          <div className="lg:col-span-2 space-y-4">
            {reviews.length === 0 ? (
              <p className="font-body text-stone-400">No reviews yet. Be the first!</p>
            ) : (
              reviews.map(review => (
                <div key={review._id} className="border-b border-stone-100 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-craft-100 flex items-center justify-center font-body font-bold text-craft-600 flex-shrink-0">
                      {review.user?.name?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-body font-medium text-sm text-ink-900">{review.user?.name}</p>
                        <StarRating rating={review.rating} readonly size={12} />
                      </div>
                      <p className="font-body text-sm text-stone-600 mt-1 leading-relaxed">{review.comment}</p>
                      <p className="font-body text-xs text-stone-400 mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
