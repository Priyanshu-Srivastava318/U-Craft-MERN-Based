import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ordered, setOrdered] = useState(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    street: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    phone: user?.phone || '',
    paymentMethod: 'COD',
    notes: ''
  });

  const shipping = cartTotal > 999 ? 0 : 99;

  const handleOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post('/api/orders', {
        shippingAddress: {
          name: form.name,
          street: form.street,
          city: form.city,
          state: form.state,
          country: form.country,
          pincode: form.pincode,
          phone: form.phone
        },
        paymentMethod: form.paymentMethod,
        notes: form.notes
      });
      setOrdered(data);
      clearCart();
      toast.success('Order placed successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (ordered) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdf8f3] px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="font-display text-3xl text-ink-900 mb-2">Order Placed!</h2>
        <p className="font-body text-stone-500 mb-2">Your order #{ordered.orderNumber} has been received.</p>
        <p className="font-body text-sm text-stone-400 mb-8">The artisan will confirm and prepare your craft with love.</p>
        <div className="flex flex-col gap-3">
          <button onClick={() => navigate('/orders')} className="btn-primary">View My Orders</button>
          <button onClick={() => navigate('/shop')} className="btn-outline">Continue Shopping</button>
        </div>
      </div>
    </div>
  );

  if (!cart.items?.length) {
    navigate('/shop');
    return null;
  }

  return (
    <div className="page-enter max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="section-title mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Form */}
        <form onSubmit={handleOrder} className="space-y-5">
          <div className="bg-white border border-stone-200 p-6">
            <h2 className="font-display text-lg text-ink-900 mb-4">Shipping Address</h2>
            <div className="space-y-4">
              <div>
                <label className="label-sm block mb-1.5">Full Name*</label>
                <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div>
                <label className="label-sm block mb-1.5">Phone*</label>
                <input className="input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
              </div>
              <div>
                <label className="label-sm block mb-1.5">Street Address*</label>
                <input className="input" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-sm block mb-1.5">City*</label>
                  <input className="input" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} required />
                </div>
                <div>
                  <label className="label-sm block mb-1.5">State*</label>
                  <input className="input" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-sm block mb-1.5">Pincode*</label>
                  <input className="input" value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} required />
                </div>
                <div>
                  <label className="label-sm block mb-1.5">Country</label>
                  <input className="input" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-6">
            <h2 className="font-display text-lg text-ink-900 mb-4">Payment Method</h2>
            <div className="space-y-3">
              {[['COD', 'Cash on Delivery'], ['UPI', 'UPI Payment (Coming soon)']].map(([val, label]) => (
                <label key={val} className={`flex items-center gap-3 p-3 border-2 cursor-pointer transition-all ${form.paymentMethod === val ? 'border-craft-500 bg-craft-50' : 'border-stone-200'} ${val === 'UPI' ? 'opacity-60' : ''}`}>
                  <input type="radio" name="payment" value={val} checked={form.paymentMethod === val}
                    onChange={() => val !== 'UPI' && setForm({ ...form, paymentMethod: val })} className="accent-craft-500" />
                  <span className="font-body text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-white border border-stone-200 p-6">
            <label className="label-sm block mb-2">Order Notes (optional)</label>
            <textarea className="input resize-none min-h-20" placeholder="Any special instructions..." value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full text-center disabled:opacity-60">
            {loading ? 'Placing Order...' : `Place Order · ₹${(cartTotal + shipping).toLocaleString()}`}
          </button>
        </form>

        {/* Order summary */}
        <div className="lg:sticky lg:top-20 h-fit">
          <div className="bg-white border border-stone-200 p-6">
            <h2 className="font-display text-lg text-ink-900 mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4">
              {cart.items?.map(item => (
                <div key={item.product?._id} className="flex gap-3">
                  <img src={item.product?.images?.[0] || 'https://placehold.co/60x60/f5ede0/8a6340?text=P'} alt="" className="w-14 h-14 object-cover flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm line-clamp-1">{item.product?.name}</p>
                    <p className="font-body text-xs text-stone-500">by {item.product?.artist?.brandName}</p>
                    <p className="font-body text-sm text-ink-900 mt-0.5">₹{item.product?.price?.toLocaleString()} × {item.quantity}</p>
                  </div>
                  <p className="font-body font-medium text-sm">₹{(item.product?.price * item.quantity)?.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-stone-200 pt-4 space-y-2">
              <div className="flex justify-between font-body text-sm text-stone-600">
                <span>Subtotal</span><span>₹{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-body text-sm text-stone-600">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>
              <div className="flex justify-between font-display text-lg pt-2 border-t border-stone-200">
                <span>Total</span><span>₹{(cartTotal + shipping).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
