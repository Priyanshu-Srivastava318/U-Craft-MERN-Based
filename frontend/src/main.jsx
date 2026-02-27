import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ❌ REMOVED: axios.defaults.baseURL — this was conflicting with api.js
// api.js (utils/api.js) handles all baseURL logic correctly
// Using both caused double /api/api/ on deployed version

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)