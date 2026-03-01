import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // ✅ AUTH LOADING — spinner dikhao, redirect mat karo
  // Yahi tha /orders ka bug — loading ke time user=null tha toh redirect ho raha tha
  if (loading) return (
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

  // Not logged in → login pe bhejo, return URL save karo
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role mismatch
  if (role === 'artist' && user.role !== 'artist') return <Navigate to="/" replace />;
  if (role === 'user'   && user.role !== 'user')   return <Navigate to="/" replace />;

  return children;
}

export default ProtectedRoute;