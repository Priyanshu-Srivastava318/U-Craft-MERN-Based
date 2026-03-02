import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart]       = useState({ items: [] });
  const [cartOpen, setCartOpen] = useState(false);
  const { user, socket }      = useAuth();

  // Fetch cart when user logs in
  const fetchCart = useCallback(async () => {
    try {
      const { data } = await api.get('/cart');
      setCart(data || { items: [] });
    } catch {
      setCart({ items: [] });
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'user') {
      fetchCart();
    } else {
      setCart({ items: [] });
    }
  }, [user?._id]);

  // Realtime cart updates via socket
  useEffect(() => {
    if (!socket) return;
    const handler = (updatedCart) => setCart(updatedCart || { items: [] });
    socket.on('cart-updated', handler);
    return () => socket.off('cart-updated', handler);
  }, [socket]);

  const addToCart = async (productId, quantity = 1) => {
    try {
      const { data } = await api.post('/cart/add', { productId, quantity });
      setCart(data);
      toast.success('Added to cart!');
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add to cart');
      return false;
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      const { data } = await api.put('/cart/update', { productId, quantity });
      setCart(data);
    } catch {
      toast.error('Failed to update cart');
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const { data } = await api.delete(`/cart/remove/${productId}`);
      setCart(data);
      toast.success('Removed from cart');
    } catch {
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      setCart({ items: [] });
    } catch {
      console.error('Failed to clear cart');
    }
  };

  // ✅ isInCart — was missing!
  const isInCart = (productId) => {
    return cart.items?.some(item =>
      (item.product?._id || item.product)?.toString() === productId?.toString()
    ) || false;
  };

  const cartCount = cart.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  const cartTotal = cart.items?.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + price * (item.quantity || 0);
  }, 0) || 0;

  return (
    <CartContext.Provider value={{
      cart, cartCount, cartTotal,
      cartOpen, setCartOpen,
      addToCart, updateQuantity, removeFromCart, clearCart,
      fetchCart, isInCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};