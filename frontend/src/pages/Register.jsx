import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [params]    = useSearchParams();
  const defaultRole = params.get('role') === 'artist' ? 'artist' : 'user';

  const [role, setRole]       = useState(defaultRole);
  const [form, setForm]       = useState({ name: '', email: '', password: '', brandName: '', specialty: '', location: '', bio: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]  = useState(false);

  const { register } = useAuth();
  const navigate     = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const data = await register({ ...form, role });
      toast.success(`Welcome to U-Craft, ${data.user.name.split(' ')[0]}!`);
      navigate(role === 'artist' ? '/artist/dashboard' : '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

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
          --sage:    #7A8C6E;
        }

        .reg-root {
          font-family: 'DM Sans', sans-serif;
          min-height: 100vh;
          display: flex;
        }

        /* ── Left panel — sticky ── */
        .reg-left {
          width: 42%;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          height: 100vh;
          background: var(--clay);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 56px;
          overflow: hidden;
        }
        .reg-left-overlay::before {
          content: '';
          position: absolute; inset: 0;
          background: radial-gradient(circle at 80% 20%, rgba(255,255,255,0.12) 0%, transparent 55%);
          pointer-events: none;
        }
        .reg-left-overlay::after {
          content: '';
          position: absolute; inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          pointer-events: none;
        }

        /* ── Right panel — scrollable ── */
        .reg-right {
          flex: 1;
          background: var(--cream);
          overflow-y: auto;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding: 60px 56px;
        }
        .reg-form-wrap {
          width: 100%;
          max-width: 440px;
          animation: regSlideIn 0.5s cubic-bezier(.22,1,.36,1) both;
        }

        @keyframes regSlideIn {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        /* ── Role toggle ── */
        .reg-role-toggle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0;
          border: 1.5px solid var(--parch-dk);
          margin-bottom: 32px;
          background: var(--parch);
        }
        .reg-role-btn {
          padding: 13px 20px;
          background: transparent;
          border: none;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.2s;
          color: var(--stone);
          position: relative;
        }
        .reg-role-btn.active {
          background: var(--ink);
          color: var(--cream);
        }
        .reg-role-btn:not(.active):hover {
          background: var(--parch-dk);
          color: var(--ink);
        }
        /* Divider between buttons */
        .reg-role-btn:first-child {
          border-right: 1px solid var(--parch-dk);
        }

        /* ── Input ── */
        .reg-input {
          width: 100%;
          background: var(--parch);
          border: 1.5px solid var(--parch-dk);
          padding: 13px 16px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.92rem;
          color: var(--ink);
          outline: none;
          transition: border-color 0.2s, background 0.2s;
          border-radius: 0;
          box-sizing: border-box;
          display: block;
        }
        .reg-input::placeholder { color: rgba(140,123,107,0.45); }
        .reg-input:focus { border-color: var(--clay); background: white; }

        textarea.reg-input { resize: vertical; min-height: 88px; }

        /* ── Label ── */
        .reg-label {
          font-size: 0.67rem;
          font-weight: 600;
          letter-spacing: 0.17em;
          text-transform: uppercase;
          color: var(--stone);
          display: block;
          margin-bottom: 7px;
        }

        /* ── Field group ── */
        .reg-field { display: flex; flex-direction: column; }

        /* ── Artist section ── */
        .reg-artist-section {
          border-top: 1px solid var(--parch-dk);
          padding-top: 28px;
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          overflow: hidden;
          transition: max-height 0.4s cubic-bezier(.22,1,.36,1), opacity 0.3s;
        }

        .reg-artist-section-label {
          font-size: 0.67rem;
          font-weight: 600;
          letter-spacing: 0.17em;
          text-transform: uppercase;
          color: var(--clay);
          padding-bottom: 4px;
          border-bottom: 1px solid rgba(196,98,45,0.2);
          margin-bottom: 4px;
        }

        /* ── Two col ── */
        .reg-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        /* ── Submit ── */
        .reg-submit {
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
          margin-top: 8px;
        }
        .reg-submit:hover:not(:disabled) {
          background: var(--clay);
          border-color: var(--clay);
          transform: translateY(-1px);
        }
        .reg-submit:disabled { opacity: 0.55; cursor: not-allowed; }

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 900px) {
          .reg-left { display: none; }
          .reg-right { padding: 48px 24px; padding-top: 72px; }
          .reg-two-col { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="reg-root">

        {/* ══ LEFT PANEL ══ */}
        <div className="reg-left reg-left-overlay" style={{ position: 'relative' }}>

          {/* Logo */}
          <Link
            to="/"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: '2rem', fontWeight: 600,
              color: 'white', textDecoration: 'none',
              position: 'relative', zIndex: 1,
            }}
          >
            U<span style={{ fontStyle: 'italic', opacity: 0.8, margin: '0 2px' }}>·</span>Craft
          </Link>

          {/* Big text art */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(3.5rem, 6vw, 6rem)',
              fontWeight: 600, lineHeight: 1,
              color: 'rgba(26,18,8,0.18)',
              marginBottom: 40,
              userSelect: 'none',
            }}>
              Join.<br />Create.<br />Inspire.
            </div>

            <div style={{ width: 40, height: 2, background: 'rgba(255,255,255,0.5)', marginBottom: 24 }} />

            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
              fontWeight: 500, color: 'white',
              lineHeight: 1.3, marginBottom: 16,
            }}>
              Join a movement<br />to celebrate craft
            </h2>
            <p style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.92rem', lineHeight: 1.75,
              color: 'rgba(255,255,255,0.65)',
              maxWidth: 320,
            }}>
              Whether you're a buyer seeking unique treasures or an artisan ready
              to share your talent — U-Craft is your home.
            </p>
          </div>

          {/* Bottom */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', gap: 24 }}>
              {[['500+', 'Artisans'], ['12K+', 'Items'], ['50+', 'Crafts']].map(([num, lbl]) => (
                <div key={lbl}>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontSize: '1.6rem', fontWeight: 600,
                    color: 'white', lineHeight: 1, marginBottom: 3,
                  }}>{num}</p>
                  <p style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: '0.7rem', fontWeight: 500,
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.5)',
                  }}>{lbl}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ══ RIGHT PANEL ══ */}
        <div className="reg-right">
          <div className="reg-form-wrap">

            {/* Header */}
            <div style={{ marginBottom: 36 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span style={{ width: 32, height: 2, background: 'var(--clay)', display: 'block' }} />
                <span style={{
                  fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: 'var(--stone)',
                }}>Create account</span>
              </div>
              <h1 style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 'clamp(2.2rem, 3.5vw, 3rem)',
                fontWeight: 600, color: 'var(--ink)',
                lineHeight: 1.08, marginBottom: 10,
              }}>
                Start your journey<br />with U-Craft
              </h1>
              <p style={{ fontSize: '0.9rem', color: 'var(--stone)', lineHeight: 1.6 }}>
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{
                    color: 'var(--clay)', fontWeight: 600, textDecoration: 'none',
                    borderBottom: '1px solid var(--clay)',
                  }}
                >
                  Sign in
                </Link>
              </p>
            </div>

            {/* ── Role toggle ── */}
            <div className="reg-role-toggle">
              <button
                type="button"
                onClick={() => setRole('user')}
                className={`reg-role-btn ${role === 'user' ? 'active' : ''}`}
              >
                Buyer
              </button>
              <button
                type="button"
                onClick={() => setRole('artist')}
                className={`reg-role-btn ${role === 'artist' ? 'active' : ''}`}
              >
                Artist
              </button>
            </div>

            {/* Role description */}
            <p style={{
              fontSize: '0.82rem', color: 'var(--stone)',
              background: 'var(--parch)',
              padding: '10px 14px',
              borderLeft: '2px solid var(--clay)',
              marginBottom: 28, lineHeight: 1.6,
            }}>
              {role === 'user'
                ? 'Browse and purchase unique handcrafted items from artisans across South Asia.'
                : 'List your handcrafted work and reach buyers across the globe — free to get started.'}
            </p>

            {/* ── Form ── */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* Common fields */}
              <div className="reg-field">
                <label className="reg-label">Full Name</label>
                <input className="reg-input" type="text" placeholder="Your full name" value={form.name} onChange={set('name')} required />
              </div>

              <div className="reg-field">
                <label className="reg-label">Email Address</label>
                <input className="reg-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
              </div>

              <div className="reg-field">
                <label className="reg-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="reg-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={set('password')}
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
                      transition: 'color 0.18s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--ink)'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--stone)'}
                  >
                    {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* ── Artist-only fields ── */}
              {role === 'artist' && (
                <div className="reg-artist-section">
                  <div className="reg-artist-section-label">Artist Details</div>

                  <div className="reg-field">
                    <label className="reg-label">Brand / Studio Name</label>
                    <input className="reg-input" type="text" placeholder="e.g. Meera's Miniatures" value={form.brandName} onChange={set('brandName')} required />
                  </div>

                  <div className="reg-two-col">
                    <div className="reg-field">
                      <label className="reg-label">Specialty</label>
                      <input className="reg-input" type="text" placeholder="e.g. Portraits, Sketches" value={form.specialty} onChange={set('specialty')} />
                    </div>
                    <div className="reg-field">
                      <label className="reg-label">Location</label>
                      <input className="reg-input" type="text" placeholder="City, State" value={form.location} onChange={set('location')} />
                    </div>
                  </div>

                  <div className="reg-field">
                    <label className="reg-label">Short Bio <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
                    <textarea
                      className="reg-input"
                      placeholder="Tell buyers about yourself and your craft..."
                      value={form.bio}
                      onChange={set('bio')}
                    />
                  </div>
                </div>
              )}

              {/* Submit */}
              <button type="submit" disabled={loading} className="reg-submit">
                {loading ? (
                  <>
                    <span style={{
                      width: 14, height: 14,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: 'white', borderRadius: '50%',
                      display: 'inline-block', animation: 'spin 0.7s linear infinite',
                    }} />
                    Creating account…
                  </>
                ) : (
                  <>
                    {role === 'artist' ? 'Start Selling' : 'Join U-Craft'}
                    <ArrowRight size={14} />
                  </>
                )}
              </button>

            </form>

            {/* Legal */}
            <p style={{
              marginTop: 24, fontSize: '0.72rem',
              color: 'rgba(140,123,107,0.5)', lineHeight: 1.7, textAlign: 'center',
            }}>
              By creating an account you agree to our{' '}
              <span style={{ borderBottom: '1px solid var(--parch-dk)', cursor: 'pointer' }}>Terms of Service</span>
              {' '}and{' '}
              <span style={{ borderBottom: '1px solid var(--parch-dk)', cursor: 'pointer' }}>Privacy Policy</span>.
            </p>

          </div>
        </div>
      </div>
    </>
  );
}