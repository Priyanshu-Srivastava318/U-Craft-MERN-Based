import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
import axios from 'axios';

const STATUS_COLORS = {
  placed: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  processing: 'bg-amber-100 text-amber-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const STATUS_STEPS = ['placed', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/orders/my-orders')
      .then(({ data }) => setOrders(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 py-16 space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="h-40 skeleton" />)}
    </div>
  );

  return (
    <div className="page-enter max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="section-title mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <ShoppingBag size={48} className="text-stone-300 mx-auto mb-4" />
          <p className="font-display text-2xl text-stone-400">No orders yet</p>
          <Link to="/shop" className="btn-primary mt-6 inline-block">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => {
            const stepIdx = STATUS_STEPS.indexOf(order.orderStatus);
            return (
              <div key={order._id} className="bg-white border border-stone-200 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-stone-50 border-b border-stone-200">
                  <div>
                    <p className="font-body font-semibold text-ink-900">#{order.orderNumber}</p>
                    <p className="font-body text-xs text-stone-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg">₹{order.total?.toLocaleString()}</span>
                    <span className={`text-xs px-3 py-1 font-body capitalize font-medium ${STATUS_COLORS[order.orderStatus]}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                {order.orderStatus !== 'cancelled' && (
                  <div className="px-6 py-4 border-b border-stone-100">
                    <div className="flex items-center justify-between">
                      {STATUS_STEPS.map((step, i) => (
                        <div key={step} className="flex-1 flex items-center">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${i <= stepIdx ? 'bg-craft-500' : 'bg-stone-200'}`} />
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`h-0.5 flex-1 ${i < stepIdx ? 'bg-craft-500' : 'bg-stone-200'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      {STATUS_STEPS.map((step, i) => (
                        <span key={step} className={`font-body text-xs capitalize ${i <= stepIdx ? 'text-craft-600' : 'text-stone-400'}`}>
                          {step}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="px-6 py-4 space-y-3">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <img src={item.image || 'https://placehold.co/60x60/f5ede0/8a6340?text=P'} alt="" className="w-12 h-12 object-cover" />
                      <div className="flex-1">
                        <Link to={`/product/${item.product?._id}`} className="font-body text-sm hover:text-craft-600 transition-colors">{item.name}</Link>
                        <p className="font-body text-xs text-stone-500">Qty: {item.quantity} · ₹{item.price?.toLocaleString()} each</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-stone-50 border-t border-stone-100 text-xs font-body text-stone-500">
                  Ship to: {order.shippingAddress?.name}, {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
