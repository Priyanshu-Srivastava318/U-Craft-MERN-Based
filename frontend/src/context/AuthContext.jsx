import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]                   = useState(null);
  const [artistProfile, setArtistProfile] = useState(null);
  const [socket, setSocket]               = useState(null);
  const [loading, setLoading]             = useState(true);

  /* ── Socket connect/disconnect based on user ── */
  useEffect(() => {
    if (user) {
      // Socket URL = Railway base URL (without /api)
      const socketURL = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
        .replace('/api', '');

      const s = io(socketURL, { transports: ['websocket'] });

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

        // Silently refresh from server
        api.get('/auth/me')
          .then(({ data }) => {
            setUser(data.user);
            setArtistProfile(data.artistProfile || null);
            localStorage.setItem('user', JSON.stringify(data.user));
          })
          .catch(() => clearSession())
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
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);

    if (data.user.role === 'artist') {
      const meRes = await api.get('/auth/me');
      setArtistProfile(meRes.data.artistProfile || null);
    }

    return data;
  }, []);

  /* ── Register ── */
  const register = useCallback(async (formData) => {
    const { data } = await api.post('/auth/register', formData);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);

    if (data.user.role === 'artist') {
      const meRes = await api.get('/auth/me');
      setArtistProfile(meRes.data.artistProfile || null);
    }

    return data;
  }, []);

  /* ── Logout ── */
  const logout = useCallback(() => {
    clearSession();
  }, []);

  /* ── Update user ── */
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
    isUser:   user?.role === 'user',
  };

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