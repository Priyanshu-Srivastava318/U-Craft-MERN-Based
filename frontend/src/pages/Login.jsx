import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]  = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      navigate(data.user.role === 'artist' ? '/artist/dashboard' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=Instrument+Serif:ital@1&display=swap');

        :root {
          --ink:     #1A1208;
          --clay:    #C4622D;
          --clay-lt: #D97B4A;
          --parch:   #F7F0E6;
          --parch-dk:#EDE3D5;
          --stone:   #8C7B6B;
          --cream:   #FDFAF5;
        }

        .auth-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
        }

        /* ── Left panel ── */
        .auth-left {
          background: var(--ink);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 56px;
        }
        .auth-left-noise::after {
          content: '';
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
        }
        .auth-left-orb {
          position: absolute;
          bottom: -100px; right: -80px;
          width: 480px; height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(196,98,45,0.22) 0%, transparent 65%);
          pointer-events: none;
        }
        .auth-left-orb2 {
          position: absolute;
          top: -60px; left: -60px;
          width: 280px; height: 280px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(196,98,45,0.1) 0%, transparent 70%);
          pointer-events: none;
        }

        /* ── Right panel ── */
        .auth-right {
          background: var(--cream);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 56px;
        }
        .auth-form-wrap {
          width: 100%;
          max-width: 400px;
        }

        /* ── Input ── */
        .auth-input {
          width: 100%;
          background: var(--parch);
          border: 1.5px solid var(--parch-dk);
          padding: 14px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.92rem;
          color: var(--ink);
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          border-radius: 0;
          box-sizing: border-box;
        }
        .auth-input::placeholder { color: rgba(140,123,107,0.55); }
        .auth-input:focus {
          border-color: var(--clay);
          background: white;
        }

        /* ── Submit button ── */
        .auth-submit {
          width: 100%;
          background: var(--ink);
          color: var(--cream);
          border: 1.5px solid var(--ink);
          padding: 15px 24px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.22s, transform 0.18s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 0;
        }
        .auth-submit:hover:not(:disabled) {
          background: var(--clay);
          border-color: var(--clay);
          transform: translateY(-1px);
        }
        .auth-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        /* ── Label ── */
        .auth-label {
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--stone);
          display: block;
          margin-bottom: 8px;
        }

        /* ── Divider ── */
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 28px 0;
        }
        .auth-divider-line {
          flex: 1;
          height: 1px;
          background: var(--parch-dk);
        }
        .auth-divider-text {
          font-size: 0.72rem;
          color: var(--stone);
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        /* ── Hover row ── */
        .auth-field { position: relative; }

        /* ── Slide-in anim ── */
        @keyframes authSlideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .auth-form-wrap { animation: authSlideIn 0.5s cubic-bezier(.22,1,.36,1) both; }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .auth-root { grid-template-columns: 1fr; }
          .auth-left  { display: none; }
          .auth-right { padding: 40px 24px; align-items: flex-start; padding-top: 80px; }
        }
      `}</style>

      <div className="auth-root">

        {/* ══ LEFT PANEL ══ */}
        <div className="auth-left auth-left-noise">
          <div className="auth-left-orb" />
          <div className="auth-left-orb2" />

          {/* Logo */}
          <Link
            to="/"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '2rem', fontWeight: 600,
              color: 'white', textDecoration: 'none',
              display: 'flex', alignItems: 'baseline', gap: 3,
              position: 'relative', zIndex: 1,
            }}
          >
            U
            <span style={{ color: 'var(--clay-lt)', fontStyle: 'italic', marginRight: 2 }}>·</span>
            Craft
          </Link>

          {/* Center visual */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Large editorial type */}
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(4rem, 7vw, 7rem)',
              fontWeight: 600, lineHeight: 1,
              color: 'rgba(247,240,230,0.07)',
              marginBottom: 40,
              userSelect: 'none',
            }}>
              Made<br />with<br />heart.
            </div>

            <div style={{ width: 40, height: 2, background: 'var(--clay)', marginBottom: 24 }} />

            <blockquote style={{
              fontFamily: "'Instrument Serif', serif",
              fontStyle: 'italic',
              fontSize: '1.55rem',
              color: 'rgba(247,240,230,0.8)',
              lineHeight: 1.5,
              marginBottom: 16,
              maxWidth: 340,
            }}>
              "Every craft tells a story of patience, skill, and love."
            </blockquote>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.78rem', fontWeight: 500,
              letterSpacing: '0.14em', textTransform: 'uppercase',
              color: 'rgba(140,123,107,0.7)',
            }}>
              — The U-Craft Philosophy
            </p>
          </div>

          {/* Bottom */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.72rem', color: 'rgba(140,123,107,0.5)',
              letterSpacing: '0.1em',
            }}>
              © 2025 U-Craft · All rights reserved
            </p>
          </div>
        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="auth-right">
          <div className="auth-form-wrap">

            {/* Mobile logo */}
            <Link
              to="/"
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: '1.8rem', fontWeight: 600,
                color: 'var(--ink)', textDecoration: 'none',
                display: 'none', marginBottom: 36,
              }}
              className="mobile-logo"
            >
              U<span style={{ color: 'var(--clay)' }}>·</span>Craft
            </Link>

            {/* Header */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ width: 32, height: 2, background: 'var(--clay)', display: 'block' }} />
                <span style={{
                  fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: 'var(--stone)',
                }}>Welcome back</span>
              </div>
              <h1 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(2.4rem, 3.5vw, 3.2rem)',
                fontWeight: 600, color: 'var(--ink)',
                lineHeight: 1.05, marginBottom: 10,
              }}>
                Sign in to<br />your account
              </h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--stone)', lineHeight: 1.6 }}>
                Don't have one?{' '}
                <Link
                  to="/register"
                  style={{
                    color: 'var(--clay)', fontWeight: 600, textDecoration: 'none',
                    borderBottom: '1px solid var(--clay)',
                  }}
                >
                  Create account
                </Link>
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

              <div className="auth-field">
                <label className="auth-label">Email Address</label>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="auth-input"
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                    style={{ paddingRight: 48 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--stone)', padding: 4, lineHeight: 0,
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--stone)'}
                  >
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div style={{ paddingTop: 8 }}>
                <button type="submit" disabled={loading} className="auth-submit">
                  {loading ? (
                    <>
                      <span style={{
                        width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: 'white', borderRadius: '50%',
                        display: 'inline-block', animation: 'spin 0.7s linear infinite',
                      }} />
                      Signing in…
                    </>
                  ) : (
                    <>Sign In <ArrowRight size={14} /></>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">or</span>
              <div className="auth-divider-line" />
            </div>

            {/* Register CTA */}
            <Link
              to="/register"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px 24px',
                border: '1.5px solid var(--parch-dk)',
                background: 'transparent',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.82rem', fontWeight: 600, letterSpacing: '0.12em',
                textTransform: 'uppercase', color: 'var(--ink)',
                textDecoration: 'none',
                transition: 'border-color 0.2s, background 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.background = 'var(--parch)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--parch-dk)'; e.currentTarget.style.background = 'transparent'; }}
            >
              Create new account <ArrowRight size={13} />
            </Link>

            {/* Legal */}
            <p style={{
              marginTop: 32, fontSize: '0.72rem',
              color: 'rgba(140,123,107,0.55)', lineHeight: 1.7, textAlign: 'center',
            }}>
              By signing in you agree to our{' '}
              <span style={{ borderBottom: '1px solid var(--parch-dk)', cursor: 'pointer' }}>Terms of Service</span>
              {' '}and{' '}
              <span style={{ borderBottom: '1px solid var(--parch-dk)', cursor: 'pointer' }}>Privacy Policy</span>.
            </p>

          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .mobile-logo { display: flex !important; }
        }
      `}</style>
    </>
  );
}