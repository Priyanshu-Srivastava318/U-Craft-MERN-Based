import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, Package, RefreshCw, X, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  placed:     { bg:'#EFF6FF', text:'#1D4ED8' },
  confirmed:  { bg:'#EDE9FE', text:'#6D28D9' },
  processing: { bg:'#FFFBEB', text:'#B45309' },
  shipped:    { bg:'#F5F3FF', text:'#7C3AED' },
  delivered:  { bg:'#F0FDF4', text:'#166534' },
  cancelled:  { bg:'#FEF2F2', text:'#B91C1C' },
};
const STATUS_STEPS = ['placed','confirmed','processing','shipped','delivered'];

const REFUND_REASONS = [
  'Wrong item received',
  'Item damaged / defective',
  'Item not as described',
  'Changed my mind',
  'Ordered by mistake',
  'Other',
];

export default function MyOrders() {
  const [orders,      setOrders]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [cancelling,  setCancelling]  = useState(null);
  const [confirmId,   setConfirmId]   = useState(null);

  // Refund request modal state
  const [refundModal,  setRefundModal]  = useState(null); // orderId
  const [refundReason, setRefundReason] = useState('');
  const [refundOther,  setRefundOther]  = useState('');
  const [submitting,   setSubmitting]   = useState(false);

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

  useEffect(() => {
    if (!socket) return;
    socket.on('order-status-updated', ({ orderId, status }) => {
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, orderStatus: status } : o));
      setLastUpdated(new Date());
    });
    socket.on('order-confirmed', (newOrder) => {
      setOrders(prev => {
        const exists = prev.find(o => o._id === newOrder._id);
        if (exists) return prev.map(o => o._id === newOrder._id ? newOrder : o);
        return [newOrder, ...prev];
      });
      setLastUpdated(new Date());
    });
    return () => { socket.off('order-status-updated'); socket.off('order-confirmed'); };
  }, [socket]);

  // ── Cancel (unpaid placed orders only) ──
  const handleCancel = async (orderId) => {
    setCancelling(orderId);
    try {
      await api.delete(`/orders/${orderId}`);
      setOrders(prev => prev.filter(o => o._id !== orderId));
      toast.success('Order cancelled successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
    } finally {
      setCancelling(null);
      setConfirmId(null);
    }
  };

  // ── Refund request submit ──
  const handleRefundSubmit = async () => {
    const finalReason = refundReason === 'Other' ? refundOther.trim() : refundReason;
    if (!finalReason) return toast.error('Please select a reason');

    setSubmitting(true);
    try {
      const { data } = await api.post(`/orders/${refundModal}/refund-request`, { reason: finalReason });
      setOrders(prev => prev.map(o => o._id === refundModal ? data.order : o));
      toast.success('Refund request submitted! We will review it shortly.');
      setRefundModal(null);
      setRefundReason('');
      setRefundOther('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-4">
      <div className="h-8 skeleton w-48 mb-6"/>
      {[...Array(3)].map((_,i) => <div key={i} className="h-44 skeleton"/>)}
    </div>
  );

  return (
    <div className="page-enter max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* ── Cancel confirm modal ── */}
      {confirmId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'white', padding:32, maxWidth:400, width:'100%', border:'1px solid #E8DDD4' }}>
            <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.4rem', fontWeight:600, marginBottom:12 }}>Cancel Order?</h3>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.88rem', color:'#6B5E52', marginBottom:24, lineHeight:1.7 }}>
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>
            <div style={{ display:'flex', gap:12 }}>
              <button onClick={() => handleCancel(confirmId)} disabled={cancelling === confirmId}
                style={{ flex:1, padding:'11px', background:'#B91C1C', color:'white', border:'none', fontFamily:"'DM Sans',sans-serif", fontSize:'0.82rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', opacity: cancelling ? 0.6 : 1 }}>
                {cancelling === confirmId ? 'Cancelling…' : 'Yes, Cancel'}
              </button>
              <button onClick={() => setConfirmId(null)}
                style={{ flex:1, padding:'11px', background:'transparent', color:'#1A1208', border:'1.5px solid #1A1208', fontFamily:"'DM Sans',sans-serif", fontSize:'0.82rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer' }}>
                Keep Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Refund request modal ── */}
      {refundModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'white', padding:32, maxWidth:440, width:'100%', border:'1px solid #E8DDD4' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <AlertCircle size={18} style={{ color:'#B45309' }}/>
              <h3 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.4rem', fontWeight:600 }}>Request Refund / Cancel</h3>
            </div>
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.85rem', color:'#6B5E52', marginBottom:20, lineHeight:1.7 }}>
              Select a reason for your refund request. Our team will review it within 24-48 hours.
            </p>

            {/* Reason options */}
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
              {REFUND_REASONS.map(r => (
                <label key={r} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', border:`1.5px solid ${refundReason === r ? '#C4622D' : '#E8DDD4'}`, background: refundReason === r ? '#FDF5EF' : 'white', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:'0.85rem', color:'#1A1208', transition:'all 0.15s' }}>
                  <input type="radio" name="reason" value={r} checked={refundReason === r} onChange={() => setRefundReason(r)} style={{ accentColor:'#C4622D' }}/>
                  {r}
                </label>
              ))}
            </div>

            {/* Other text input */}
            {refundReason === 'Other' && (
              <textarea
                value={refundOther}
                onChange={e => setRefundOther(e.target.value)}
                placeholder="Please describe your reason..."
                rows={3}
                style={{ width:'100%', padding:'10px 14px', border:'1.5px solid #E8DDD4', fontFamily:"'DM Sans',sans-serif", fontSize:'0.85rem', color:'#1A1208', resize:'none', outline:'none', marginBottom:16, boxSizing:'border-box' }}
              />
            )}

            <div style={{ display:'flex', gap:12, marginTop:8 }}>
              <button onClick={handleRefundSubmit} disabled={submitting || !refundReason}
                style={{ flex:1, padding:'11px', background: (!refundReason || submitting) ? '#ccc' : '#C4622D', color:'white', border:'none', fontFamily:"'DM Sans',sans-serif", fontSize:'0.82rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', cursor: (!refundReason || submitting) ? 'not-allowed' : 'pointer' }}>
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
              <button onClick={() => { setRefundModal(null); setRefundReason(''); setRefundOther(''); }}
                style={{ flex:1, padding:'11px', background:'transparent', color:'#1A1208', border:'1.5px solid #1A1208', fontFamily:"'DM Sans',sans-serif", fontSize:'0.82rem', fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-title">My Orders</h1>
          {lastUpdated && (
            <p className="font-body text-xs text-stone-400 mt-1">Updated {lastUpdated.toLocaleTimeString()}</p>
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
            const stepIdx   = STATUS_STEPS.indexOf(order.orderStatus);
            const color     = STATUS_COLORS[order.orderStatus] || STATUS_COLORS.placed;
            const canCancel = order.orderStatus === 'placed' && order.paymentStatus !== 'paid';
            const refStatus = order.refundRequest?.status;

            // Show refund button if: not cancelled, not delivered, no pending/approved request already
            const canRefund = !canCancel
              && order.orderStatus !== 'cancelled'
              && order.orderStatus !== 'delivered'
              && refStatus !== 'pending'
              && refStatus !== 'approved';

            return (
              <div key={order._id} className="bg-white border border-stone-200 overflow-hidden">

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-stone-50 border-b border-stone-200">
                  <div>
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-stone-400"/>
                      <p className="font-body font-semibold text-sm">#{order.orderNumber}</p>
                    </div>
                    <p className="font-body text-xs text-stone-500 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'})}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-display text-lg">₹{order.total?.toLocaleString()}</span>
                    <span className="text-xs px-3 py-1 font-body capitalize font-semibold"
                      style={{ background: color.bg, color: color.text }}>
                      {order.orderStatus}
                    </span>
                    {order.paymentMethod === 'razorpay' && order.paymentStatus === 'paid' && (
                      <span className="text-xs px-2 py-1 font-body font-medium" style={{ background:'#F0FDF4', color:'#166534' }}>
                        Paid ✓
                      </span>
                    )}

                    {/* Cancel button — unpaid placed orders */}
                    {canCancel && (
                      <button onClick={() => setConfirmId(order._id)}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 12px', background:'transparent', border:'1px solid #FECACA', color:'#B91C1C', fontFamily:"'DM Sans',sans-serif", fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background='#FEF2F2'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <X size={11}/> Cancel
                      </button>
                    )}

                    {/* Refund request button */}
                    {canRefund && (
                      <button onClick={() => setRefundModal(order._id)}
                        style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 12px', background:'transparent', border:'1px solid #FED7AA', color:'#B45309', fontFamily:"'DM Sans',sans-serif", fontSize:'0.72rem', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background='#FFF7ED'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <AlertCircle size={11}/> Refund
                      </button>
                    )}

                    {/* Refund pending badge */}
                    {refStatus === 'pending' && (
                      <span style={{ fontSize:'0.7rem', padding:'3px 10px', background:'#FFF8EB', color:'#B45309', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>
                        ⏳ Refund Pending
                      </span>
                    )}

                    {/* Refund approved badge */}
                    {refStatus === 'approved' && (
                      <span style={{ fontSize:'0.7rem', padding:'3px 10px', background:'#EBFFF0', color:'#166534', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>
                        ✓ Refund Approved
                      </span>
                    )}

                    {/* Refund rejected badge */}
                    {refStatus === 'rejected' && (
                      <span style={{ fontSize:'0.7rem', padding:'3px 10px', background:'#FEF2F2', color:'#B91C1C', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}
                        title={order.refundRequest?.adminNote || ''}>
                        ✕ Refund Rejected
                      </span>
                    )}
                  </div>
                </div>

                {/* Admin note if refund rejected */}
                {refStatus === 'rejected' && order.refundRequest?.adminNote && (
                  <div style={{ padding:'10px 24px', background:'#FEF2F2', borderBottom:'1px solid #FECACA' }}>
                    <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.8rem', color:'#B91C1C' }}>
                      <strong>Reason:</strong> {order.refundRequest.adminNote}
                    </p>
                  </div>
                )}

                {/* Progress tracker */}
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
                      <img src={item.image || 'https://placehold.co/60x60/f5ede0/8a6340?text=P'} alt={item.name} className="w-12 h-12 object-cover flex-shrink-0"/>
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${item.product?._id||item.product}`} className="font-body text-sm hover:text-craft-600 transition-colors line-clamp-1">
                          {item.name}
                        </Link>
                        <p className="font-body text-xs text-stone-500">Qty: {item.quantity} · ₹{item.price?.toLocaleString()} each</p>
                      </div>
                      <p className="font-body text-sm font-medium whitespace-nowrap">₹{(item.price * item.quantity)?.toLocaleString()}</p>
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