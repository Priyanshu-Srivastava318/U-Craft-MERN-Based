import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState({ items: [] });
  const [cartOpen, setCartOpen] = useState(false);
  const { user, socket } = useAuth();

  useEffect(() => {
    if (user && user.role === 'user') {
      fetchCart();
    } else {
      setCart({ items: [] });
    }
  }, [user]);

  useEffect(() => {
    if (socket) {
      socket.on('cart-updated', (updatedCart) => {
        setCart(updatedCart);
      });
    }
  }, [socket]);

  const fetchCart = async () => {
    try {
      const { data } = await axios.get('/api/cart');
      setCart(data);
    } catch (err) {
      console.error('Failed to fetch cart');
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      const { data } = await axios.post('/api/cart/add', { productId, quantity });
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
      const { data } = await axios.put('/api/cart/update', { productId, quantity });
      setCart(data);
    } catch (err) {
      toast.error('Failed to update cart');
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const { data } = await axios.delete(`/api/cart/remove/${productId}`);
      setCart(data);
      toast.success('Removed from cart');
    } catch (err) {
      toast.error('Failed to remove item');
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete('/api/cart/clear');
      setCart({ items: [] });
    } catch (err) {
      console.error('Failed to clear cart');
    }
  };

  const cartCount = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const cartTotal = cart.items?.reduce((sum, item) => {
    const price = item.product?.price || 0;
    return sum + price * item.quantity;
  }, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, cartCount, cartTotal, cartOpen, setCartOpen, addToCart, updateQuantity, removeFromCart, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
