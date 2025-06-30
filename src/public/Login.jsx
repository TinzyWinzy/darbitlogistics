import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import logo from '../public/logo.jpg';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/login`,
        { username, password },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );
      if (response.data && response.data.user && response.data.token) {
        localStorage.setItem('jwt_token', response.data.token);
        setUser(response.data.user);
        navigate('/dashboard');
      } else {
        throw new Error('Invalid login response from server.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setUser(null);
    navigate('/login');
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light" role="main">
      <div className="card shadow-sm border-0" style={{ maxWidth: '400px', width: '100%' }}>
        <div className="card-body p-3 p-md-4">
          <div className="text-center mb-3">
            <img src={logo} alt="Morres Logistics Logo" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', marginBottom: 6 }} />
            <h2 className="card-title fw-bold mb-1" style={{ color: '#1F2120', fontSize: '1.25rem' }}>
              Sign In
            </h2>
            <p className="text-muted mb-2" style={{ fontSize: '0.97em' }}>Morres Logistics Operator Hub</p>
          </div>
          <form onSubmit={handleSubmit} noValidate aria-label="Login form">
            <div className="form-floating mb-2">
              <input
                type="text"
                className="form-control"
                id="username"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                aria-label="Username"
                style={{ fontSize: '0.97em', padding: '0.5em 0.7em' }}
              />
              <label htmlFor="username" style={{ fontSize: '0.95em' }}>Username</label>
            </div>
            <div className="form-floating mb-2 position-relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-control"
                id="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                aria-label="Password"
                aria-describedby="togglePassword"
                style={{ fontSize: '0.97em', padding: '0.5em 0.7em' }}
              />
              <label htmlFor="password" style={{ fontSize: '0.95em' }}>Password</label>
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary position-absolute end-0 top-50 translate-middle-y me-2"
                id="togglePassword"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((show) => !show)}
                tabIndex={0}
                style={{ zIndex: 2 }}
              >
                <span className="material-icons-outlined" aria-hidden="true">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <div aria-live="polite" className="mb-2" style={{ minHeight: 28, fontSize: '0.97em' }}>
              {error && (
                <div className="alert alert-danger text-center py-2 mb-0" role="alert" style={{ fontSize: '0.97em', padding: '0.4em 0.7em' }} aria-live="assertive" aria-atomic="true">{error}</div>
              )}
            </div>
            <div className="d-grid mt-3">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary fw-bold"
                style={{ background: '#1F2120', border: 'none', color: '#EBD3AD', fontSize: '1.08rem', padding: '0.5em 0.7em' }}
                aria-label="Sign in"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      <style>{`
        .form-control, .form-select, .btn {
          border-radius: 5px !important;
          border-color: #D2691E !important;
        }
        .form-control:focus-visible, .form-select:focus-visible, .btn:focus-visible {
          outline: 2px solid #D2691E !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 2px #EBD3AD !important;
          z-index: 2;
        }
        .form-floating > label {
          color: #7c6a4d !important;
        }
        .btn:disabled, .btn[disabled] {
          background: #e5e1db !important;
          color: #bbb !important;
          border-color: #D2691E !important;
        }
        @media (max-width: 600px) {
          .card-body.p-3.p-md-4 {
            padding: 0.7rem 0.3rem !important;
          }
          .form-floating {
            margin-bottom: 0.7rem !important;
          }
          .btn.fw-bold {
            font-size: 1rem !important;
            padding: 0.5em 0.5em !important;
          }
        }
        .btn.fw-bold:not(:disabled):hover, .btn.fw-bold:not(:disabled):focus-visible {
          background: #D2691E !important;
          color: #fff !important;
          box-shadow: 0 2px 8px rgba(210,105,30,0.13) !important;
          border-color: #D2691E !important;
        }
      `}</style>
    </div>
  );
} 