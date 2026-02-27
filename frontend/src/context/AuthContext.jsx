import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]               = useState(null);
  const [artistProfile, setArtistProfile] = useState(null);
  const [socket, setSocket]           = useState(null);
  const [loading, setLoading]         = useState(true); // true on first load

  /* ── Axios: attach token to every request ── */
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  /* ── Socket connect/disconnect based on user ── */
  useEffect(() => {
    if (user) {
      const s = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        transports: ['websocket'],
      });
      s.on('connect', () => {
        if (user.role === 'artist' && artistProfile) {
          s.emit('join-artist-room', artistProfile._id);
        }
        s.emit('join-user-room', user._id);
      });
      setSocket(s);
      return () => s.disconnect();
    } else {
      setSocket(null);
    }
  }, [user?._id, artistProfile?._id]);

  /* ── On mount: restore session from localStorage ── */
  useEffect(() => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (token && saved) {
      try {
        const parsedUser = JSON.parse(saved);
        setUser(parsedUser);
        // Silently refresh from server to get latest data
        axios.get('/api/auth/me')
          .then(({ data }) => {
            setUser(data.user);
            setArtistProfile(data.artistProfile || null);
            localStorage.setItem('user', JSON.stringify(data.user));
          })
          .catch(() => {
            // Token expired — clear everything
            clearSession();
          })
          .finally(() => setLoading(false));
      } catch {
        clearSession();
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const clearSession = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setArtistProfile(null);
  };

  /* ── Login ── */
  const login = useCallback(async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);

    // Fetch artist profile if needed
    if (data.user.role === 'artist') {
      const meRes = await axios.get('/api/auth/me');
      setArtistProfile(meRes.data.artistProfile || null);
    }

    return data;
  }, []);

  /* ── Register ── */
  const register = useCallback(async (formData) => {
    const { data } = await axios.post('/api/auth/register', formData);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);

    if (data.user.role === 'artist') {
      const meRes = await axios.get('/api/auth/me');
      setArtistProfile(meRes.data.artistProfile || null);
    }

    return data;
  }, []);

  /* ── Logout ── */
  const logout = useCallback(() => {
    clearSession();
  }, []);

  /* ── Update user (profile update ke baad call karo) ── */
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    artistProfile,
    socket,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isArtist: user?.role === 'artist',
    isUser: user?.role === 'user',
  };

  // Don't render children until we know auth state (prevents flash)
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#FDFAF5',
      }}>
        <div style={{
          width: 32, height: 32,
          border: '2px solid #EDE3D5',
          borderTopColor: '#C4622D',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}