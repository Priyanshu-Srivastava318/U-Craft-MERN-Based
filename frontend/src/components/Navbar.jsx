import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, User, LogOut, LayoutDashboard, Heart, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount, setCartOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  // ✅ Track window width — no CSS class dependency
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    setProfileOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/'); };

  const navLinks = [
    { label: 'Home',    path: '/' },
    { label: 'Shop',    path: '/shop' },
    { label: 'Artists', path: '/artists' },
    { label: 'About',   path: '/about' },
  ];

  return (
    <nav style={{ position:'sticky', top:0, zIndex:50, background:'var(--cream)', borderBottom:'1px solid var(--parch-dk)' }}>
      <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:68 }}>

        {/* Logo */}
        <Link to="/" style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'1.6rem', fontWeight:700, color:'var(--ink)', textDecoration:'none', letterSpacing:'-0.01em', flexShrink:0 }}>
          U<span style={{ color:'var(--clay)' }}>·</span>Craft
        </Link>

        {/* Desktop nav links */}
        {!isMobile && (
          <div style={{ display:'flex', alignItems:'center', gap:32 }}>
            {navLinks.map(link => (
              <Link key={link.path} to={link.path} style={{
                fontFamily:"'DM Sans',sans-serif", fontSize:'0.88rem',
                color: isActive(link.path) ? 'var(--clay)' : 'var(--stone)',
                fontWeight: isActive(link.path) ? 600 : 400,
                textDecoration:'none', transition:'color 0.2s', whiteSpace:'nowrap',
              }}>
                {link.label}
              </Link>
            ))}
          </div>
        )}

        {/* Right side */}
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>

          {/* ✅ Cart icon — buyers only, always rendered when role=user */}
          {user?.role === 'user' && (
            <button
              onClick={() => setCartOpen(true)}
              style={{ position:'relative', padding:'8px 10px', background:'none', border:'none', cursor:'pointer', color:'var(--stone)', display:'flex', alignItems:'center', justifyContent:'center' }}
              title="View cart"
            >
              <ShoppingBag size={22} color="var(--stone)" />
              {cartCount > 0 && (
                <span style={{
                  position:'absolute', top:3, right:3,
                  background:'var(--clay)', color:'white',
                  fontSize:'0.58rem', fontWeight:700,
                  minWidth:16, height:16, borderRadius:8,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontFamily:"'DM Sans',sans-serif", padding:'0 3px', lineHeight:1,
                }}>
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          )}

          {/* Desktop: user menu / auth buttons */}
          {!isMobile && (
            user ? (
              <div style={{ position:'relative' }} ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen(p => !p)}
                  style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', background:'none', border:'1.5px solid var(--parch-dk)', cursor:'pointer', transition:'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--clay)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--parch-dk)'}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width:26, height:26, borderRadius:'50%', objectFit:'cover' }} />
                  ) : (
                    <div style={{ width:26, height:26, borderRadius:'50%', background:'var(--clay)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'0.75rem', fontWeight:700, flexShrink:0 }}>
                      {user.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'0.84rem', color:'var(--ink)', fontWeight:500, whiteSpace:'nowrap' }}>
                    {user.name?.split(' ')[0]}
                  </span>
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div style={{ position:'absolute', right:0, top:'calc(100% + 8px)', width:210, background:'white', border:'1.5px solid var(--parch-dk)', boxShadow:'4px 4px 0 rgba(26,18,8,0.07)', zIndex:100 }}>
                    {user.role === 'artist' ? (
                      <Link to="/artist/dashboard" style={dropStyle}>
                        <LayoutDashboard size={15}/> Dashboard
                      </Link>
                    ) : (
                      <>
                        <Link to="/orders" style={dropStyle}>
                          <Package size={15}/> My Orders
                        </Link>
                        <Link to="/wishlist" style={dropStyle}>
                          <Heart size={15}/> Wishlist
                        </Link>
                      </>
                    )}
                    <Link to="/profile" style={{ ...dropStyle, borderTop:'1px solid var(--parch-dk)' }}>
                      <User size={15}/> Profile
                    </Link>
                    <button onClick={handleLogout} style={{ ...dropStyle, borderTop:'1px solid var(--parch-dk)', color:'#B91C1C', width:'100%', background:'none', cursor:'pointer', textAlign:'left' }}>
                      <LogOut size={15}/> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display:'flex', gap:8 }}>
                <Link to="/login"    className="btn-outline" style={{ padding:'8px 18px' }}>Login</Link>
                <Link to="/register" className="btn-primary" style={{ padding:'8px 18px' }}>Sign Up</Link>
              </div>
            )
          )}

          {/* Mobile: hamburger */}
          {isMobile && (
            <button onClick={() => setMobileOpen(p => !p)} style={{ padding:6, background:'none', border:'none', cursor:'pointer', color:'var(--ink)', display:'flex', alignItems:'center' }}>
              {mobileOpen ? <X size={22}/> : <Menu size={22}/>}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {isMobile && mobileOpen && (
        <div style={{ background:'white', borderTop:'1px solid var(--parch-dk)', padding:'12px 24px 20px' }}>
          {navLinks.map(link => (
            <Link key={link.path} to={link.path} style={{ display:'block', padding:'11px 0', fontFamily:"'DM Sans',sans-serif", fontSize:'0.9rem', color: isActive(link.path) ? 'var(--clay)' : 'var(--ink)', fontWeight: isActive(link.path) ? 600 : 400, textDecoration:'none', borderBottom:'1px solid var(--parch)' }}>
              {link.label}
            </Link>
          ))}
          {user ? (
            <>
              {user.role === 'user' && (
                <Link to="/orders" style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 0', fontFamily:"'DM Sans',sans-serif", fontSize:'0.9rem', color:'var(--ink)', textDecoration:'none', borderBottom:'1px solid var(--parch)' }}>
                  <Package size={15}/> My Orders
                </Link>
              )}
              {user.role === 'user' && (
                <Link to="/wishlist" style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 0', fontFamily:"'DM Sans',sans-serif", fontSize:'0.9rem', color:'var(--ink)', textDecoration:'none', borderBottom:'1px solid var(--parch)' }}>
                  <Heart size={15}/> Wishlist
                </Link>
              )}
              {user.role === 'artist' && (
                <Link to="/artist/dashboard" style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 0', fontFamily:"'DM Sans',sans-serif", fontSize:'0.9rem', color:'var(--ink)', textDecoration:'none', borderBottom:'1px solid var(--parch)' }}>
                  <LayoutDashboard size={15}/> Dashboard
                </Link>
              )}
              <Link to="/profile" style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 0', fontFamily:"'DM Sans',sans-serif", fontSize:'0.9rem', color:'var(--ink)', textDecoration:'none', borderBottom:'1px solid var(--parch)' }}>
                <User size={15}/> Profile
              </Link>
              <button onClick={handleLogout} style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 0', fontFamily:"'DM Sans',sans-serif", fontSize:'0.9rem', color:'#B91C1C', background:'none', border:'none', cursor:'pointer' }}>
                <LogOut size={15}/> Sign Out
              </button>
            </>
          ) : (
            <div style={{ display:'flex', gap:8, marginTop:16 }}>
              <Link to="/login"    className="btn-outline" style={{ flex:1, justifyContent:'center' }}>Login</Link>
              <Link to="/register" className="btn-primary" style={{ flex:1, justifyContent:'center' }}>Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

const dropStyle = {
  display:'flex', alignItems:'center', gap:10,
  padding:'11px 16px',
  fontFamily:"'DM Sans',sans-serif", fontSize:'0.84rem',
  color:'var(--ink)', textDecoration:'none',
  transition:'background 0.15s', cursor:'pointer',
  background:'none', border:'none', width:'100%', textAlign:'left',
};