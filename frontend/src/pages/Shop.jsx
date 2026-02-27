import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Search, X } from 'lucide-react';
import axios from 'axios';
import ProductCard from '../components/ProductCard';

const CATEGORIES = ['All', 'Paintings', 'Pottery', 'Jewelry', 'Textiles', 'Woodwork', 'Metalwork', 'Leather', 'Glass', 'Paper', 'Other'];
const SORTS = [
  { value: 'createdAt', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = params.get('category') || 'All';
  const sort = params.get('sort') || 'createdAt';
  const search = params.get('search') || '';
  const page = Number(params.get('page') || 1);
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (category !== 'All') query.set('category', category);
        if (sort) query.set('sort', sort);
        if (search) query.set('search', search);
        if (minPrice) query.set('minPrice', minPrice);
        if (maxPrice) query.set('maxPrice', maxPrice);
        query.set('page', page);
        query.set('limit', 12);

        const { data } = await axios.get(`/api/products?${query}`);

        // Safe handling — backend array ya object dono handle karo
        if (Array.isArray(data)) {
          setProducts(data);
          setTotal(data.length);
          setPages(1);
        } else {
          setProducts(Array.isArray(data.products) ? data.products : []);
          setTotal(data.total || 0);
          setPages(data.pages || 1);
        }
      } catch (err) {
        console.error(err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category, sort, search, page, minPrice, maxPrice]);

  const setParam = (key, value) => {
    const newParams = new URLSearchParams(params);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    newParams.delete('page');
    setParams(newParams);
  };

  return (
    <div className="page-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <p className="label-sm mb-2">Explore</p>
        <h1 className="section-title">The Collection</h1>
        <p className="font-body text-stone-500 mt-2">{total} handcrafted items from our artisans</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input type="text" placeholder="Search crafts..." className="input pl-10"
            value={search} onChange={e => setParam('search', e.target.value)} />
        </div>
        <select className="input !w-auto" value={sort} onChange={e => setParam('sort', e.target.value)}>
          {SORTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <button onClick={() => setFiltersOpen(!filtersOpen)} className="btn-outline !py-3 flex items-center gap-2">
          <SlidersHorizontal size={15} /> Filters
        </button>
      </div>

      {filtersOpen && (
        <div className="bg-white border border-stone-200 p-6 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <label className="label-sm block mb-3">Min Price (₹)</label>
            <input type="number" className="input" placeholder="0" value={minPrice}
              onChange={e => setParam('minPrice', e.target.value)} />
          </div>
          <div>
            <label className="label-sm block mb-3">Max Price (₹)</label>
            <input type="number" className="input" placeholder="10000" value={maxPrice}
              onChange={e => setParam('maxPrice', e.target.value)} />
          </div>
          <div className="flex items-end">
            <button onClick={() => { setParam('minPrice', ''); setParam('maxPrice', ''); }}
              className="btn-outline w-full flex items-center gap-2 justify-center">
              <X size={14} /> Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-8">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setParam('category', cat === 'All' ? '' : cat)}
            className={`font-body text-xs px-4 py-2 border transition-all ${
              category === cat || (cat === 'All' && !params.get('category'))
                ? 'bg-craft-500 border-craft-500 text-white'
                : 'border-stone-300 text-stone-600 hover:border-craft-400 hover:text-craft-600'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(12)].map((_, i) => <div key={i} className="aspect-[3/4] skeleton" />)}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-display text-2xl text-stone-400">No products found</p>
          <p className="font-body text-stone-400 mt-2">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => <ProductCard key={product._id} product={product} />)}
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-12">
          {[...Array(pages)].map((_, i) => (
            <button key={i} onClick={() => setParam('page', i + 1)}
              className={`w-10 h-10 font-body text-sm border transition-all ${
                page === i + 1 ? 'bg-craft-500 text-white border-craft-500' : 'border-stone-300 text-stone-600 hover:border-craft-400'
              }`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}