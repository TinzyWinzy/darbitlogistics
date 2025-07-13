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
  const [rememberMe, setRememberMe] = useState(false);

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
        { username, password, rememberMe },
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
            {/* Password field using input group for robust alignment */}
            <div className="mb-2">
              <label htmlFor="password" style={{ fontSize: '0.95em', marginBottom: 4 }}>Password</label>
              <div className="input-group">
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
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  id="togglePassword"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((show) => !show)}
                  tabIndex={0}
                  style={{ minWidth: 40, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span className="material-icons-outlined" aria-hidden="true">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
            <div className="form-check mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label className="form-check-label" htmlFor="rememberMe" style={{ fontSize: '0.97em', cursor: 'pointer' }}>
                Remember Me
              </label>
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
          pointer-events: auto !important;
        }
        .form-floating, .form-check-input {
          pointer-events: auto !important;
        }
        .form-control:focus-visible, .form-select:focus-visible, .btn:focus-visible {
          outline: 2px solid #D2691E !important;
          outline-offset: 2px !important;
          box-shadow: 0 0 0 2px #EBD3AD !important;
        }
        .form-floating > label {
          color: #7c6a4d !important;
        }
        #password.form-control {
          padding-right: 0.7em !important;
        }
        .btn:disabled, .btn[disabled] {
          background: #e5e1db !important;
          color: #bbb !important;
          border-color: #D2691E !important;
        }
        @media (max-width: 600px) {
          .card {
            max-width: 95vw !important;
            width: 100% !important;
            margin: 0 1vw !important;
          }
          .card-body.p-3.p-md-4 {
            padding: 0.7rem 0.3rem !important;
          }
          .form-floating {
            margin-bottom: 1.1rem !important;
          }
          .btn.fw-bold {
            font-size: 1.08rem !important;
            padding: 0.7em 0.5em !important;
            min-height: 44px !important;
          }
          .form-control {
            font-size: 1.05em !important;
            padding: 0.7em 0.9em !important;
            min-height: 44px !important;
          }
          #password.form-control {
            padding-right: 0.7em !important;
          }
          .form-check-label, .form-floating > label {
            font-size: 1.05em !important;
          }
          /* PATCH: Restrict togglePassword and checkbox size on mobile */
          #togglePassword {
            min-width: 44px !important;
            min-height: 44px !important;
            width: 44px !important;
            height: 44px !important;
            font-size: 1.15em !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            max-width: 44px !important;
            max-height: 44px !important;
          }
          .form-check-input {
            width: 22px !important;
            height: 22px !important;
            min-width: 22px !important;
            min-height: 22px !important;
            max-width: 22px !important;
            max-height: 22px !important;
            margin-top: 0.2em !important;
            margin-right: 0.5em !important;
            vertical-align: middle !important;
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