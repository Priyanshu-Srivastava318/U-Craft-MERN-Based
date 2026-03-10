import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';

import Home            from './pages/Home';
import Login           from './pages/Login';
import Register        from './pages/Register';
import Shop            from './pages/Shop';
import ProductDetail   from './pages/ProductDetail';
import Artists         from './pages/Artists';
import ArtistProfile   from './pages/ArtistProfile';
import ArtistDashboard from './pages/ArtistDashboard';
import Checkout        from './pages/Checkout';
import MyOrders        from './pages/MyOrders';
import Wishlist        from './pages/Wishlist';
import Profile         from './pages/Profile';
import About           from './pages/About';
import ChatPage        from './pages/chat';
import AdminDashboard  from './pages/AdminDashboard';  // ✅ already imported

function Spinner() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#FDFAF5' }}>
      <div style={{ width:32, height:32, border:'2px solid #EDE3D5', borderTopColor:'#C4622D', borderRadius:'50%', animation:'spin 0.7s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role === 'artist' && user.role !== 'artist') return <Navigate to="/" replace />;
  if (role === 'user'   && user.role !== 'user')   return <Navigate to="/" replace />;
  return children;
}

function PageTransition({ children }) {
  const location = useLocation();
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    const raf = requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.45s cubic-bezier(.22,1,.36,1), transform 0.45s cubic-bezier(.22,1,.36,1)';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }));
    return () => cancelAnimationFrame(raf);
  }, [location.pathname]);
  return <div ref={ref} style={{ minHeight:'100vh' }}>{children}</div>;
}

function RouteProgressBar() {
  const location = useLocation();
  const barRef = useRef(null);
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    bar.style.transition = 'none';
    bar.style.width = '0%';
    bar.style.opacity = '1';
    const t1 = setTimeout(() => { bar.style.transition = 'width 0.4s cubic-bezier(.22,1,.36,1)'; bar.style.width = '85%'; }, 10);
    const t2 = setTimeout(() => { bar.style.transition = 'width 0.3s ease, opacity 0.3s ease'; bar.style.width = '100%'; }, 380);
    const t3 = setTimeout(() => { bar.style.opacity = '0'; }, 680);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [location.pathname]);
  return (
    <div ref={barRef} style={{ position:'fixed', top:0, left:0, zIndex:9999, height:2, width:0, opacity:0, background:'linear-gradient(90deg,#C4622D,#D97B4A)', pointerEvents:'none', boxShadow:'0 0 10px rgba(196,98,45,0.5)' }}/>
  );
}

function ScrollReset() {
  const location = useLocation();
  useEffect(() => { window.scrollTo({ top:0, behavior:'instant' }); }, [location.pathname]);
  return null;
}

function Layout({ children, hideFooter = false }) {
  return (
    <>
      <Navbar />
      <CartDrawer />
      <main style={{ minHeight:'60vh' }}>{children}</main>
      {!hideFooter && <Footer />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Instrument+Serif:ital@1&display=swap');
            *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
            :root{--ink:#1A1208;--clay:#C4622D;--clay-lt:#D97B4A;--parch:#F7F0E6;--parch-dk:#EDE3D5;--stone:#8C7B6B;--cream:#FDFAF5;--sage:#7A8C6E;--nav-h:68px}
            html{scroll-behavior:smooth}
            body{font-family:'DM Sans',sans-serif;background:var(--cream);color:var(--ink);-webkit-font-smoothing:antialiased}
            ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-track{background:var(--parch)}::-webkit-scrollbar-thumb{background:var(--stone)}::-webkit-scrollbar-thumb:hover{background:var(--clay)}
            ::selection{background:rgba(196,98,45,0.18);color:var(--ink)}
            [data-reveal]{opacity:0;transform:translateY(24px);transition:opacity 0.65s cubic-bezier(.22,1,.36,1),transform 0.65s cubic-bezier(.22,1,.36,1)}
            [data-reveal][data-visible='true']{opacity:1;transform:translateY(0)}
            .btn-primary{display:inline-flex;align-items:center;gap:9px;background:var(--ink);color:var(--cream);font-family:'DM Sans',sans-serif;font-size:0.78rem;font-weight:600;letter-spacing:0.13em;text-transform:uppercase;padding:13px 28px;border:1.5px solid var(--ink);cursor:pointer;transition:background 0.22s,color 0.22s,transform 0.18s,border-color 0.22s;text-decoration:none;border-radius:0}
            .btn-primary:hover{background:var(--clay);border-color:var(--clay);transform:translateY(-1px)}
            .btn-outline{display:inline-flex;align-items:center;gap:9px;background:transparent;color:var(--ink);font-family:'DM Sans',sans-serif;font-size:0.78rem;font-weight:600;letter-spacing:0.13em;text-transform:uppercase;padding:12px 28px;border:1.5px solid var(--ink);cursor:pointer;transition:background 0.22s,color 0.22s;text-decoration:none;border-radius:0}
            .btn-outline:hover{background:var(--ink);color:var(--cream)}
            .btn-clay{display:inline-flex;align-items:center;gap:9px;background:var(--clay);color:white;font-family:'DM Sans',sans-serif;font-size:0.78rem;font-weight:600;letter-spacing:0.13em;text-transform:uppercase;padding:13px 28px;border:1.5px solid var(--clay);cursor:pointer;transition:background 0.22s,transform 0.18s;text-decoration:none;border-radius:0}
            .btn-clay:hover{background:#a8501f;transform:translateY(-1px)}
            .label-sm{font-family:'DM Sans',sans-serif;font-size:0.67rem;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:var(--stone)}
            .section-title{font-family:'Cormorant Garamond',Georgia,serif;font-size:clamp(2rem,3vw,2.8rem);font-weight:600;color:var(--ink);line-height:1.1}
            .input{width:100%;background:var(--parch);border:1.5px solid var(--parch-dk);padding:13px 16px;font-family:'DM Sans',sans-serif;font-size:0.92rem;color:var(--ink);outline:none;transition:border-color 0.2s,background 0.2s;border-radius:0;display:block}
            .input::placeholder{color:rgba(140,123,107,0.45)}
            .input:focus{border-color:var(--clay);background:white}
            .skeleton{background:linear-gradient(90deg,var(--parch) 25%,var(--parch-dk) 50%,var(--parch) 75%);background-size:200% 100%;animation:skeletonPulse 1.5s ease-in-out infinite}
            @keyframes skeletonPulse{0%{background-position:200% 0}100%{background-position:-200% 0}}
            @keyframes marqueeScroll{from{transform:translateX(0)}to{transform:translateX(-50%)}}
            .animate-marquee{animation:marqueeScroll 30s linear infinite}
            .animate-marquee:hover{animation-play-state:paused}
          `}</style>

          <RouteProgressBar />
          <ScrollReset />

          <PageTransition>
            <Routes>
              {/* Public */}
              <Route path="/login"       element={<Login />} />
              <Route path="/register"    element={<Register />} />
              <Route path="/"            element={<Layout><Home /></Layout>} />
              <Route path="/shop"        element={<Layout><Shop /></Layout>} />
              <Route path="/product/:id" element={<Layout><ProductDetail /></Layout>} />
              <Route path="/artists"     element={<Layout><Artists /></Layout>} />
              <Route path="/artist/:id"  element={<Layout><ArtistProfile /></Layout>} />
              <Route path="/about"       element={<Layout><About /></Layout>} />

              {/* ✅ Admin — no Navbar/Footer, no auth required (self-protected via key) */}
              <Route path="/admin" element={<AdminDashboard />} />

              {/* Checkout */}
              <Route path="/checkout" element={<Layout hideFooter><Checkout /></Layout>} />

              {/* Any logged-in user */}
              <Route path="/orders" element={
                <ProtectedRoute><Layout><MyOrders /></Layout></ProtectedRoute>
              }/>
              <Route path="/wishlist" element={
                <ProtectedRoute><Layout><Wishlist /></Layout></ProtectedRoute>
              }/>
              <Route path="/profile" element={
                <ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>
              }/>

              {/* Chat — buyers only */}
              <Route path="/chat/:artistId" element={
                <ProtectedRoute><Layout hideFooter><ChatPage /></Layout></ProtectedRoute>
              }/>

              {/* Artist only */}
              <Route path="/artist/dashboard" element={
                <ProtectedRoute role="artist"><Layout><ArtistDashboard /></Layout></ProtectedRoute>
              }/>
            </Routes>
          </PageTransition>

          <Toaster position="top-right" toastOptions={{
            duration: 3500,
            style: { fontFamily:"'DM Sans',sans-serif", fontSize:'0.88rem', borderRadius:'0', border:'1px solid #EDE3D5', background:'#FDFAF5', color:'#1A1208', boxShadow:'4px 4px 0 rgba(26,18,8,0.08)', padding:'12px 16px' },
            success: { iconTheme:{ primary:'#C4622D', secondary:'#FDFAF5' } },
            error:   { iconTheme:{ primary:'#1A1208', secondary:'#FDFAF5' } },
          }}/>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}