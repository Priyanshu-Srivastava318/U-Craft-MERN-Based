import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, CreditCard, Truck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [ordered, setOrdered] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

  const [form, setForm] = useState({
    name: user?.name || '',
    street: user?.address?.street || '',
    city: user?.address?.city || '',
    state: user?.address?.state || '',
    country: user?.address?.country || 'India',
    pincode: user?.address?.pincode || '',
    phone: user?.phone || '',
    notes: ''
  });

  const shipping = cartTotal > 999 ? 0 : 99;
  const total = cartTotal + shipping;

  // ── Auth guard AFTER hooks ──────────────────────────────────
  if (!user) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#FDFAF5' }}>
        <div style={{ textAlign:'center' }}>
          <p style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.8rem', color:'#1A1208' }}>Please login to checkout</p>
          <a href="/login" style={{ display:'inline-block', marginTop:16, background:'#C4622D', color:'white', padding:'12px 28px', textDecoration:'none', fontFamily:"'DM Sans',sans-serif", fontSize:'0.8rem', letterSpacing:'0.12em', textTransform:'uppercase' }}>Login</a>
        </div>
      </div>
    );
  }

  // ── Razorpay loader ─────────────────────────────────────────
  const loadRazorpay = () => new Promise((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

  const handleRazorpayPayment = async (orderData) => {
    const loaded = await loadRazorpay();
    if (!loaded) { toast.error('Payment gateway failed to load'); return; }

    const { data: rzpOrder } = await api.post('/orders/razorpay/create', { amount: total });

    return new Promise((resolve, reject) => {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: rzpOrder.amount,
        currency: 'INR',
        name: 'U·Craft',
        description: `Order Payment — ${cart.items?.length} item(s)`,
        order_id: rzpOrder.id,
        prefill: { name: form.name, email: user?.email || '', contact: form.phone },
        theme: { color: '#C4622D' },
        handler: async (response) => {
          try {
            await api.post('/orders/razorpay/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderData._id,
            });
            resolve({ success: true, paymentId: response.razorpay_payment_id });
          } catch {
            reject(new Error('Payment verification failed'));
          }
        },
        modal: { ondismiss: () => reject(new Error('Payment cancelled')) },
      };
      new window.Razorpay(options).open();
    });
  };

  // ── Place Order ─────────────────────────────────────────────
  const handleOrder = async (e) => {
    e.preventDefault();
    if (!cart.items?.length) { toast.error('Cart is empty'); return; }

    setLoading(true);
    let newOrder = null;
    try {
      const { data } = await api.post('/orders', {
        shippingAddress: {
          name: form.name, street: form.street, city: form.city,
          state: form.state, country: form.country,
          pincode: form.pincode, phone: form.phone,
        },
        paymentMethod,
        notes: form.notes,
      });
      newOrder = data;

      if (paymentMethod === 'razorpay') {
        await handleRazorpayPayment(newOrder);
        toast.success('Payment successful! Order confirmed.');
      } else {
        toast.success('Order placed successfully!');
      }

      clearCart();
      setOrdered(newOrder);
    } catch (err) {
      if (err.message === 'Payment cancelled') {
        toast.error('Payment cancelled.');
        try { if (newOrder?._id) await api.delete(`/orders/${newOrder._id}`); } catch {}
      } else {
        toast.error(err.response?.data?.message || err.message || 'Failed to place order');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ───────────────────────────────────────────
  if (ordered) return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdf8f3] px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h2 className="font-display text-3xl text-ink-900 mb-2">Order Placed!</h2>
        <p className="font-body text-stone-500 mb-1">Order #{ordered.orderNumber}</p>
        <p className="font-body text-sm text-stone-400 mb-2">
          {paymentMethod === 'razorpay' ? '✓ Payment confirmed' : 'Cash on Delivery selected'}
        </p>
        <p className="font-body text-sm text-stone-400 mb-8">The artisan will prepare your craft with love ❤️</p>
        <div className="flex flex-col gap-3">
          <button onClick={() => navigate('/orders')} className="btn-primary">Track My Order</button>
          <button onClick={() => navigate('/shop')} className="btn-outline">Continue Shopping</button>
        </div>
      </div>
    </div>
  );

  if (!cart.items?.length) { navigate('/shop'); return null; }

  const Spinner = () => (
    <span style={{ width:14,height:14,borderRadius:'50%',display:'inline-block',border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'white',animation:'spin 0.7s linear infinite' }}/>
  );

  return (
    <div className="page-enter max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="section-title mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <form onSubmit={handleOrder} className="space-y-5">

          {/* Shipping */}
          <div className="bg-white border border-stone-200 p-6">
            <h2 className="font-display text-lg text-ink-900 mb-4 flex items-center gap-2">
              <Truck size={18}/> Shipping Address
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-sm block mb-1.5">Full Name *</label>
                  <input className="input" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
                </div>
                <div>
                  <label className="label-sm block mb-1.5">Phone *</label>
                  <input className="input" type="tel" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required/>
                </div>
              </div>
              <div>
                <label className="label-sm block mb-1.5">Street Address *</label>
                <input className="input" value={form.street} onChange={e=>setForm({...form,street:e.target.value})} required/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-sm block mb-1.5">City *</label>
                  <input className="input" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} required/>
                </div>
                <div>
                  <label className="label-sm block mb-1.5">State *</label>
                  <input className="input" value={form.state} onChange={e=>setForm({...form,state:e.target.value})} required/>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-sm block mb-1.5">Pincode *</label>
                  <input className="input" value={form.pincode} onChange={e=>setForm({...form,pincode:e.target.value})} required/>
                </div>
                <div>
                  <label className="label-sm block mb-1.5">Country</label>
                  <input className="input" value={form.country} onChange={e=>setForm({...form,country:e.target.value})}/>
                </div>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white border border-stone-200 p-6">
            <h2 className="font-display text-lg text-ink-900 mb-4 flex items-center gap-2">
              <CreditCard size={18}/> Payment Method
            </h2>
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-4 border-2 cursor-pointer transition-all ${paymentMethod==='razorpay'?'border-craft-500 bg-craft-50':'border-stone-200 hover:border-stone-300'}`}>
                <input type="radio" name="payment" value="razorpay" checked={paymentMethod==='razorpay'} onChange={()=>setPaymentMethod('razorpay')} className="accent-craft-500"/>
                <div className="flex-1">
                  <p className="font-body text-sm font-medium">Online Payment</p>
                  <p className="font-body text-xs text-stone-500">UPI, Cards, Net Banking via Razorpay</p>
                </div>
                <span style={{fontSize:'0.65rem',background:'#072654',color:'white',padding:'2px 6px',fontWeight:700,borderRadius:2}}>razorpay</span>
              </label>

              <label className={`flex items-center gap-3 p-4 border-2 cursor-pointer transition-all ${paymentMethod==='COD'?'border-craft-500 bg-craft-50':'border-stone-200 hover:border-stone-300'}`}>
                <input type="radio" name="payment" value="COD" checked={paymentMethod==='COD'} onChange={()=>setPaymentMethod('COD')} className="accent-craft-500"/>
                <div className="flex-1">
                  <p className="font-body text-sm font-medium">Cash on Delivery</p>
                  <p className="font-body text-xs text-stone-500">Pay when your order arrives</p>
                </div>
                <Truck size={18} className="text-stone-400"/>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white border border-stone-200 p-6">
            <label className="label-sm block mb-2">Order Notes (optional)</label>
            <textarea className="input resize-none min-h-20" placeholder="Special instructions for the artisan..."
              value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/>
          </div>

          <button type="submit" disabled={loading}
            style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:8,
              background:loading?'#8C7B6B':'#C4622D',color:'white',border:'none',padding:'16px 28px',
              fontFamily:"'DM Sans',sans-serif",fontSize:'0.84rem',fontWeight:700,
              letterSpacing:'0.14em',textTransform:'uppercase',
              cursor:loading?'not-allowed':'pointer',transition:'background 0.2s'}}>
            {loading
              ? <><Spinner/> Processing…</>
              : paymentMethod==='razorpay'
                ? `Pay ₹${total.toLocaleString()} via Razorpay`
                : `Place Order · ₹${total.toLocaleString()}`
            }
          </button>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </form>

        {/* Order Summary */}
        <div className="lg:sticky lg:top-24 h-fit space-y-4">
          <div className="bg-white border border-stone-200 p-6">
            <h2 className="font-display text-lg text-ink-900 mb-4">Order Summary</h2>
            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
              {cart.items?.map(item => (
                <div key={item.product?._id} className="flex gap-3">
                  <img src={item.product?.images?.[0]||'https://placehold.co/60x60/f5ede0/8a6340?text=P'} alt="" className="w-14 h-14 object-cover flex-shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm line-clamp-1">{item.product?.name}</p>
                    <p className="font-body text-xs text-stone-500">by {item.product?.artist?.brandName}</p>
                    <p className="font-body text-xs text-stone-400 mt-0.5">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-body font-medium text-sm whitespace-nowrap">₹{(item.product?.price*item.quantity)?.toLocaleString()}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-stone-200 pt-4 space-y-2">
              <div className="flex justify-between font-body text-sm text-stone-600">
                <span>Subtotal</span><span>₹{cartTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-body text-sm text-stone-600">
                <span>Shipping</span>
                <span className={shipping===0?'text-green-600':''}>{shipping===0?'FREE':`₹${shipping}`}</span>
              </div>
              {shipping>0 && <p className="font-body text-xs text-stone-400">Free shipping above ₹999</p>}
              <div className="flex justify-between font-display text-xl pt-3 border-t border-stone-200">
                <span>Total</span><span>₹{total.toLocaleString()}</span>
              </div>
            </div>
          </div>
          <div className="bg-stone-50 border border-stone-200 p-4">
            <p className="font-body text-xs text-stone-500 text-center">🔒 Secure checkout · Your data is safe</p>
          </div>
        </div>
      </div>
    </div>
  );
}