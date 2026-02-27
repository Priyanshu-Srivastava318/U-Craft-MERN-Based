import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/users/wishlist')
      .then(({ data }) => setItems(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="section-title mb-8">My Wishlist</h1>
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => <div key={i} className="aspect-[3/4] skeleton" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={48} className="text-stone-300 mx-auto mb-4" />
          <p className="font-display text-2xl text-stone-400">Your wishlist is empty</p>
          <Link to="/shop" className="btn-primary mt-6 inline-block">Explore Shop</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {items.map(product => <ProductCard key={product._id} product={product} />)}
        </div>
      )}
    </div>
  );
}
