import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Package, RefreshCw } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  placed:     { bg:'#EFF6FF', text:'#1D4ED8' },
  confirmed:  { bg:'#EDE9FE', text:'#6D28D9' },
  processing: { bg:'#FFFBEB', text:'#B45309' },
  shipped:    { bg:'#F5F3FF', text:'#7C3AED' },
  delivered:  { bg:'#F0FDF4', text:'#166534' },
  cancelled:  { bg:'#FEF2F2', text:'#B91C1C' },
};
const STATUS_STEPS = ['placed','confirmed','processing','shipped','delivered'];

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const { socket } = useAuth();

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/orders/my-orders');
      setOrders(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ✅ Realtime order status updates
  useEffect(() => {
    if (!socket) return;

    socket.on('order-status-updated', ({ orderId, status }) => {
      setOrders(prev => prev.map(o =>
        o._id === orderId ? { ...o, orderStatus: status } : o
      ));
      setLastUpdated(new Date());
    });

    socket.on('order-confirmed', (newOrder) => {
      setOrders(prev => {
        const exists = prev.find(o => o._id === newOrder._id);
        if (exists) return prev.map(o => o._id===newOrder._id ? newOrder : o);
        return [newOrder, ...prev];
      });
      setLastUpdated(new Date());
    });

    return () => {
      socket.off('order-status-updated');
      socket.off('order-confirmed');
    };
  }, [socket]);

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-4">
      <div className="h-8 skeleton w-48 mb-6"/>
      {[...Array(3)].map((_,i) => <div key={i} className="h-44 skeleton"/>)}
    </div>
  );

  return (
    <div className="page-enter max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">My Orders</h1>
          {lastUpdated && (
            <p className="font-body text-xs text-stone-400 mt-1">
              Updated {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 font-body text-xs text-stone-500 hover:text-craft-600 transition-colors px-3 py-2 border border-stone-200 hover:border-craft-400">
          <RefreshCw size={13}/> Refresh
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24">
          <ShoppingBag size={52} className="text-stone-200 mx-auto mb-4"/>
          <p className="font-display text-2xl text-stone-400 mb-2">No orders yet</p>
          <p className="font-body text-sm text-stone-400 mb-8">Your order history will appear here</p>
          <Link to="/shop" className="btn-primary">Start Shopping</Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map(order => {
            const stepIdx = STATUS_STEPS.indexOf(order.orderStatus);
            const color = STATUS_COLORS[order.orderStatus] || STATUS_COLORS.placed;

            return (
              <div key={order._id} className="bg-white border border-stone-200 overflow-hidden">

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-stone-50 border-b border-stone-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-stone-400"/>
                      <p className="font-body font-semibold text-sm text-ink-900">#{order.orderNumber}</p>
                    </div>
                    <p className="font-body text-xs text-stone-500 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-display text-lg">₹{order.total?.toLocaleString()}</span>
                    <span
                      className="text-xs px-3 py-1 font-body capitalize font-semibold"
                      style={{background: color.bg, color: color.text}}
                    >
                      {order.orderStatus}
                    </span>
                    {order.paymentMethod === 'razorpay' && order.paymentStatus === 'paid' && (
                      <span className="text-xs px-2 py-1 font-body font-medium" style={{background:'#F0FDF4',color:'#166534'}}>
                        Paid
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                {order.orderStatus !== 'cancelled' && (
                  <div className="px-6 py-4 border-b border-stone-100">
                    <div className="flex items-center">
                      {STATUS_STEPS.map((step, i) => (
                        <div key={step} className="flex-1 flex items-center">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 transition-all ${i<=stepIdx?'bg-craft-500':'bg-stone-200'}`}/>
                          {i < STATUS_STEPS.length-1 && (
                            <div className={`h-0.5 flex-1 transition-all ${i<stepIdx?'bg-craft-500':'bg-stone-200'}`}/>
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1.5">
                      {STATUS_STEPS.map((step,i) => (
                        <span key={step} className={`font-body text-xs capitalize ${i<=stepIdx?'text-craft-600 font-medium':'text-stone-400'}`}>
                          {step}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="px-6 py-4 space-y-3">
                  {order.items?.map((item,i) => (
                    <div key={i} className="flex items-center gap-3">
                      <img
                        src={item.image || 'https://placehold.co/60x60/f5ede0/8a6340?text=P'}
                        alt={item.name}
                        className="w-12 h-12 object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${item.product?._id||item.product}`} className="font-body text-sm hover:text-craft-600 transition-colors line-clamp-1">
                          {item.name}
                        </Link>
                        <p className="font-body text-xs text-stone-500">Qty: {item.quantity} · ₹{item.price?.toLocaleString()} each</p>
                      </div>
                      <p className="font-body text-sm font-medium whitespace-nowrap">
                        ₹{(item.price * item.quantity)?.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-stone-50 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                  <p className="font-body text-xs text-stone-500">
                    📦 {order.shippingAddress?.name}, {order.shippingAddress?.city}, {order.shippingAddress?.state} — {order.shippingAddress?.pincode}
                  </p>
                  <p className="font-body text-xs text-stone-400 capitalize">
                    Payment: {order.paymentMethod === 'razorpay' ? 'Online' : 'Cash on Delivery'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}