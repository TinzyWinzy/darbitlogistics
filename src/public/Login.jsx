import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import axios from 'axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setIsAuthenticated } = useContext(AuthContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/login`,
        { username: email, password },
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (res.data.success) {
        setIsAuthenticated(true);
        navigate('/dashboard');
      } else {
        setError(res.data.error || 'Invalid credentials');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response) {
        // Server responded with error
        setError(err.response.data?.error || 'Login failed');
      } else if (err.request) {
        // Request made but no response
        setError('No response from server. Please try again.');
      } else {
        // Request setup error
        setError('Error setting up request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <div className="card shadow-sm border-0 p-4 w-100" style={{ maxWidth: 400, background: 'rgba(255,255,255,0.97)' }}>
        <div className="text-center mb-3">
          <span className="material-icons fs-1 mb-2" style={{ color: '#D2691E' }}>login</span>
          <h1 className="h3 fw-bold mb-3" style={{ color: '#a14e13' }}>Operator Login</h1>
        </div>
        <form className="w-100" onSubmit={handleLogin}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-semibold">Username</label>
            <input 
              id="email" 
              type="text" 
              className="form-control" 
              placeholder="operator" 
              required 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label fw-semibold">Password</label>
            <input 
              id="password" 
              type="password" 
              className="form-control" 
              placeholder="••••••••" 
              required 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <button 
            type="submit" 
            className="btn w-100 text-white fw-bold" 
            style={{ background: '#D2691E' }}
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        {error && (
          <div className="alert alert-danger mt-3">
            <small className="d-block"><strong>Error:</strong> {error}</small>
            {error.includes('CORS') && (
              <small className="d-block mt-1">
                If this persists, please clear your browser cookies and try again.
              </small>
            )}
          </div>
        )}
        <div className="text-center mt-4">
          <Link to="/" className="text-decoration-underline" style={{ color: '#D2691E' }}>&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  );
} 