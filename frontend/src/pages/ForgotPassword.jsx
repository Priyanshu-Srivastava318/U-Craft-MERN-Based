import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDevLink('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSent(true);
      if (data.devResetUrl) setDevLink(data.devResetUrl);
      toast.success('Reset instructions sent if the email exists.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#FDFAF5', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ width:'100%', maxWidth:420 }}>
        <Link to="/login" style={{ display:'inline-flex', alignItems:'center', gap:8, color:'#8C7B6B', textDecoration:'none', fontFamily:"'DM Sans',sans-serif", fontSize:'.86rem', marginBottom:24 }}>
          <ArrowLeft size={16}/> Back to login
        </Link>
        <div style={{ background:'white', border:'1px solid #EDE3D5', padding:28 }}>
          <div style={{ width:42, height:42, background:'#F7F0E6', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
            <Mail size={18} color="#C4622D" />
          </div>
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'2rem', fontWeight:600, color:'#1A1208', marginBottom:8 }}>Forgot password?</h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'.92rem', color:'#8C7B6B', lineHeight:1.6, marginBottom:22 }}>
            Enter your account email. We will send a secure reset link that expires in 15 minutes.
          </p>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label className="label-sm block mb-2">Email Address</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <button className="btn-primary" disabled={loading} style={{ justifyContent:'center' }}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          {sent && (
            <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'.82rem', color:'#166534', lineHeight:1.6, marginTop:18 }}>
              If this email is registered, a reset link has been sent.
            </p>
          )}
          {devLink && (
            <a href={devLink} style={{ display:'block', marginTop:12, fontSize:'.78rem', color:'#C4622D', wordBreak:'break-all' }}>
              Dev reset link
            </a>
          )}
        </div>
      </div>
    </div>
  );
}