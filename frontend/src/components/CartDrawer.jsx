import { X, Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { cart, cartTotal, cartOpen, setCartOpen, updateQuantity, removeFromCart } = useCart();
  const navigate = useNavigate();

  const shipping = cartTotal > 999 ? 0 : 99;

  if (!cartOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
        onClick={() => setCartOpen(false)}
      />
      <div className="fixed right-0 top-0 h-full w-full sm:w-96 bg-white z-50 flex flex-col shadow-2xl animate-slide-right">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-stone-200">
          <div>
            <h2 className="font-display text-xl text-ink-900">Your Cart</h2>
            <p className="label-sm mt-0.5">{cart.items?.length || 0} items</p>
          </div>
          <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-stone-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!cart.items?.length ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={48} className="text-stone-300 mb-4" />
              <p className="font-display text-lg text-stone-500">Your cart is empty</p>
              <p className="font-body text-sm text-stone-400 mt-1">Add some beautiful crafts!</p>
              <button
                onClick={() => { setCartOpen(false); navigate('/shop'); }}
                className="btn-primary mt-6"
              >
                Explore Shop
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items.map((item) => (
                <div key={item.product?._id} className="flex gap-4 py-4 border-b border-stone-100">
                  <img
                    src={item.product?.images?.[0] || '/placeholder.jpg'}
                    alt={item.product?.name}
                    className="w-20 h-20 object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-body font-medium text-sm text-ink-900 line-clamp-1">{item.product?.name}</h3>
                    <p className="font-body text-xs text-stone-500 mt-0.5">by {item.product?.artist?.brandName}</p>
                    <p className="font-display text-base text-craft-600 mt-1">₹{item.product?.price?.toLocaleString()}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        onClick={() => updateQuantity(item.product._id, item.quantity - 1)}
                        className="w-6 h-6 border border-stone-300 flex items-center justify-center hover:border-craft-500 hover:text-craft-500 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="font-body text-sm w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product._id, item.quantity + 1)}
                        className="w-6 h-6 border border-stone-300 flex items-center justify-center hover:border-craft-500 hover:text-craft-500 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product._id)}
                        className="ml-auto text-red-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.items?.length > 0 && (
          <div className="px-6 py-5 border-t border-stone-200 bg-stone-50">
            <div className="flex justify-between font-body text-sm text-stone-600 mb-1">
              <span>Subtotal</span>
              <span>₹{cartTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-body text-sm text-stone-600 mb-3">
              <span>Shipping</span>
              <span className={shipping === 0 ? 'text-sage-500' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
            </div>
            <div className="flex justify-between font-display text-lg text-ink-900 mb-4">
              <span>Total</span>
              <span>₹{(cartTotal + shipping).toLocaleString()}</span>
            </div>
            {shipping > 0 && (
              <p className="font-body text-xs text-stone-500 mb-3 text-center">Free shipping on orders above ₹999</p>
            )}
            <button
              onClick={() => { setCartOpen(false); navigate('/checkout'); }}
              className="btn-primary w-full text-center"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
