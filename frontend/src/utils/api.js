import axios from 'axios';

// Production: VITE_API_URL = https://your-railway-url.up.railway.app/api
// Dev: vite proxy handles /api → localhost:5000
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // matches AuthContext
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;