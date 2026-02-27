import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, LogOut, LayoutDashboard, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount, setCartOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
    setProfileOpen(false);
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Shop', path: '/shop' },
    { label: 'Artists', path: '/artists' },
    { label: 'About', path: '/about' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#fdf8f3] border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold text-ink-900 tracking-tight">
              U<span className="text-craft-500">·</span>Craft
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`font-body text-sm tracking-wide transition-colors ${
                  isActive(link.path)
                    ? 'text-craft-500 font-medium'
                    : 'text-stone-600 hover:text-ink-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {user && user.role === 'user' && (
              <>
                <button
                  onClick={() => setCartOpen(true)}
                  className="relative p-2 text-stone-600 hover:text-craft-500 transition-colors"
                >
                  <ShoppingBag size={20} />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-craft-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-body font-bold">
                      {cartCount}
                    </span>
                  )}
                </button>
              </>
            )}

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-craft-50 transition-colors"
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-craft-500 flex items-center justify-center text-white text-xs font-bold">
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:block font-body text-sm text-stone-700">{user.name?.split(' ')[0]}</span>
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-stone-200 shadow-lg z-50">
                    {user.role === 'artist' ? (
                      <Link
                        to="/artist/dashboard"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm font-body text-stone-700 hover:bg-craft-50 transition-colors"
                      >
                        <LayoutDashboard size={16} /> Dashboard
                      </Link>
                    ) : (
                      <>
                        <Link
                          to="/orders"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm font-body text-stone-700 hover:bg-craft-50 transition-colors"
                        >
                          <ShoppingBag size={16} /> My Orders
                        </Link>
                        <Link
                          to="/wishlist"
                          onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-sm font-body text-stone-700 hover:bg-craft-50 transition-colors"
                        >
                          <Heart size={16} /> Wishlist
                        </Link>
                      </>
                    )}
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-body text-stone-700 hover:bg-craft-50 transition-colors border-t border-stone-100"
                    >
                      <User size={16} /> Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-3 text-sm font-body text-red-600 hover:bg-red-50 transition-colors w-full border-t border-stone-100"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-outline !py-2 !px-4 hidden sm:block">Login</Link>
                <Link to="/register" className="btn-primary !py-2 !px-4">Sign Up</Link>
              </div>
            )}

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 text-stone-600"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-stone-200 px-4 py-4 space-y-3">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className="block font-body text-stone-700 hover:text-craft-500 py-2 border-b border-stone-100"
            >
              {link.label}
            </Link>
          ))}
          {!user && (
            <Link to="/login" onClick={() => setMobileOpen(false)} className="block btn-primary text-center mt-3">
              Login / Sign Up
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
