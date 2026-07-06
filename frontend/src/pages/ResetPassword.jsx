import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      toast.success(data.message || 'Password reset successful');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not reset password');
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
          <h1 style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:'2rem', fontWeight:600, color:'#1A1208', marginBottom:8 }}>Set new password</h1>
          <p style={{ fontFamily:"'DM Sans',sans-serif", fontSize:'.92rem', color:'#8C7B6B', lineHeight:1.6, marginBottom:22 }}>
            Choose a strong password with at least 6 characters.
          </p>

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <label className="label-sm block mb-2">New Password</label>
              <div style={{ position:'relative' }}>
                <input className="input" type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} minLength={6} required style={{ paddingRight:46 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:0, color:'#8C7B6B', cursor:'pointer' }}>
                  {showPass ? <EyeOff size={17}/> : <Eye size={17}/>} 
                </button>
              </div>
            </div>
            <div>
              <label className="label-sm block mb-2">Confirm Password</label>
              <input className="input" type={showPass ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={6} required />
            </div>
            <button className="btn-primary" disabled={loading} style={{ justifyContent:'center' }}>
              {loading ? 'Saving...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}