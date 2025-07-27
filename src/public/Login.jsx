import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../contexts/AuthContext';
import logo from '/logo.svg';

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
      let errorMessage;
      if (!err.response) {
        errorMessage = 'Cannot connect to server. Please check your network and try again.';
      } else {
        errorMessage = err.response?.data?.error || err.message || 'Login failed. Please check your credentials.';
      }
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
    <div className="login-container" role="main">
      {/* Animated Background */}
      <div className="background-animation">
        <div className="floating-sphere sphere-1"></div>
        <div className="floating-sphere sphere-2"></div>
        <div className="floating-sphere sphere-3"></div>
        <div className="floating-sphere sphere-4"></div>
        <div className="floating-sphere sphere-5"></div>
      </div>

      {/* Floating Particles */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{ '--delay': `${i * 0.5}s` }}></div>
        ))}
      </div>

      {/* Main Login Card */}
      <div className="login-card">
        <div className="card-glass">
          <div className="card-header-glass">
            <div className="logo-container">
              <img src={logo} alt="Dar Logistics Logo" className="logo-image" />
              <div className="logo-glow"></div>
            </div>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Access your Dar Logistics Operations Hub</p>
          </div>

          <form onSubmit={handleSubmit} noValidate aria-label="Login form" className="login-form">
            <div className="input-group-glass">
              <div className="input-wrapper">
                <input
                  type="text"
                  className="input-glass"
                  id="username"
                  placeholder=" "
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  aria-label="Username"
                />
                <label htmlFor="username" className="input-label">Username</label>
                <div className="input-border"></div>
              </div>
            </div>

            <div className="input-group-glass">
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-glass"
                  id="password"
                  placeholder=" "
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  aria-label="Password"
                />
                <label htmlFor="password" className="input-label">Password</label>
                <div className="input-border"></div>
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((show) => !show)}
                  tabIndex={0}
                >
                  <svg className="eye-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    {showPassword ? (
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round"/>
                    ) : (
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round"/>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-label">Remember Me</span>
              </label>
            </div>

            <div aria-live="polite" className="error-container">
              {error && (
                <div className="error-message" role="alert" aria-live="assertive" aria-atomic="true">
                  <svg className="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                  {error}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-button"
              aria-label="Sign in"
            >
              <span className="button-content">
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <svg className="button-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                      <polyline points="10,17 15,12 10,7"/>
                      <line x1="15" y1="12" x2="3" y2="12"/>
                    </svg>
                    <span>Sign In</span>
                  </>
                )}
              </span>
              <div className="button-glow"></div>
            </button>
          </form>

          <div className="login-footer">
            <p className="footer-text">
              Secure access to Dar Logistics Operations Console
            </p>
          </div>
        </div>
      </div>

      <style>{`
        /* CSS Custom Properties */
        :root {
          --primary-blue: #003366;
          --primary-orange: #FF6600;
          --accent-orange: #FF8533;
          --accent-blue: #0066CC;
          --success-green: #28a745;
          --warning-yellow: #ffc107;
          --danger-red: #dc3545;
          --info-cyan: #17a2b8;
          --white: #ffffff;
          --black: #000000;
          --transition-slow: 0.3s ease;
          --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-blue) 100%);
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Animated Background */
        .background-animation {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 1;
        }

        .floating-sphere {
          position: absolute;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: float 6s ease-in-out infinite;
        }

        .sphere-1 {
          width: 200px;
          height: 200px;
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .sphere-2 {
          width: 150px;
          height: 150px;
          top: 60%;
          right: 15%;
          animation-delay: 1s;
        }

        .sphere-3 {
          width: 100px;
          height: 100px;
          bottom: 20%;
          left: 20%;
          animation-delay: 2s;
        }

        .sphere-4 {
          width: 120px;
          height: 120px;
          top: 30%;
          right: 30%;
          animation-delay: 3s;
        }

        .sphere-5 {
          width: 80px;
          height: 80px;
          bottom: 40%;
          right: 10%;
          animation-delay: 4s;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }

        /* Floating Particles */
        .particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 2;
        }

        .particle {
          position: absolute;
          width: 4px;
          height: 4px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          animation: particle-float 8s linear infinite;
          animation-delay: var(--delay);
        }

        @keyframes particle-float {
          0% {
            transform: translateY(100vh) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            transform: translateY(-100px) translateX(100px);
            opacity: 0;
          }
        }

        /* Main Login Card */
        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          margin: 0 20px;
        }

        .card-glass {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 40px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
          position: relative;
          overflow: hidden;
        }

        .card-glass::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        }

        .card-header-glass {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo-container {
          position: relative;
          display: inline-block;
          margin-bottom: 16px;
        }

        .logo-image {
          width: 64px;
          height: 64px;
          border-radius: 16px;
          object-fit: cover;
          position: relative;
          z-index: 2;
        }

        .logo-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, rgba(255, 102, 0, 0.3), transparent);
          border-radius: 50%;
          filter: blur(10px);
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
        }

        .login-title {
          font-size: 28px;
          font-weight: 700;
          color: var(--white);
          margin: 0 0 8px 0;
          letter-spacing: -0.5px;
        }

        .login-subtitle {
          font-size: 16px;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          font-weight: 400;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .input-group-glass {
          position: relative;
        }

        .input-wrapper {
          position: relative;
        }

        .input-glass {
          width: 100%;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          color: var(--white);
          font-size: 16px;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .input-glass::placeholder {
          color: transparent;
        }

        .input-glass:focus {
          outline: none;
          border-color: var(--primary-orange);
          box-shadow: 0 0 0 3px rgba(255, 102, 0, 0.1);
          background: rgba(255, 255, 255, 0.15);
        }

        .input-glass:focus + .input-label,
        .input-glass:not(:placeholder-shown) + .input-label {
          transform: translateY(-24px) scale(0.85);
          color: var(--primary-orange);
        }

        .input-label {
          position: absolute;
          left: 20px;
          top: 16px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 16px;
          transition: all 0.3s ease;
          pointer-events: none;
          font-weight: 500;
        }

        .input-border {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--primary-orange), var(--accent-orange));
          transition: width 0.3s ease;
        }

        .input-glass:focus ~ .input-border {
          width: 100%;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.7);
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.3s ease;
        }

        .password-toggle:hover {
          color: var(--primary-orange);
          background: rgba(255, 255, 255, 0.1);
        }

        .eye-icon {
          width: 20px;
          height: 20px;
          stroke-width: 2;
        }

        .form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .checkbox-container {
          display: flex;
          align-items: center;
          cursor: pointer;
          gap: 12px;
        }

        .checkbox-input {
          display: none;
        }

        .checkbox-custom {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 6px;
          position: relative;
          transition: all 0.3s ease;
        }

        .checkbox-input:checked + .checkbox-custom {
          background: var(--primary-orange);
          border-color: var(--primary-orange);
        }

        .checkbox-input:checked + .checkbox-custom::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 12px;
          font-weight: bold;
        }

        .checkbox-label {
          color: rgba(255, 255, 255, 0.8);
          font-size: 14px;
          font-weight: 500;
        }

        .error-container {
          min-height: 24px;
        }

        .error-message {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: rgba(220, 53, 69, 0.1);
          border: 1px solid rgba(220, 53, 69, 0.3);
          border-radius: 12px;
          color: var(--danger-red);
          font-size: 14px;
          font-weight: 500;
        }

        .error-icon {
          width: 16px;
          height: 16px;
          stroke-width: 2;
          flex-shrink: 0;
        }

        .login-button {
          width: 100%;
          padding: 16px 24px;
          background: linear-gradient(135deg, var(--primary-orange), var(--accent-orange));
          border: none;
          border-radius: 12px;
          color: var(--white);
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .login-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(255, 102, 0, 0.3);
        }

        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .button-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          position: relative;
          z-index: 2;
        }

        .button-icon {
          width: 20px;
          height: 20px;
          stroke-width: 2;
        }

        .button-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .login-button:hover .button-glow {
          opacity: 1;
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid var(--white);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .login-footer {
          text-align: center;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .footer-text {
          color: rgba(255, 255, 255, 0.6);
          font-size: 12px;
          margin: 0;
        }

        /* Responsive Design */
        @media (max-width: 480px) {
          .login-card {
            margin: 0 16px;
          }

          .card-glass {
            padding: 32px 24px;
          }

          .login-title {
            font-size: 24px;
          }

          .login-subtitle {
            font-size: 14px;
          }

          .input-glass {
            padding: 14px 16px;
            font-size: 16px;
          }

          .input-label {
            left: 16px;
            top: 14px;
            font-size: 16px;
          }

          .login-button {
            padding: 14px 20px;
            font-size: 16px;
          }
        }

        /* Generate particles at random positions */
        .particle:nth-child(1) { left: 10%; animation-delay: 0s; }
        .particle:nth-child(2) { left: 20%; animation-delay: 0.5s; }
        .particle:nth-child(3) { left: 30%; animation-delay: 1s; }
        .particle:nth-child(4) { left: 40%; animation-delay: 1.5s; }
        .particle:nth-child(5) { left: 50%; animation-delay: 2s; }
        .particle:nth-child(6) { left: 60%; animation-delay: 2.5s; }
        .particle:nth-child(7) { left: 70%; animation-delay: 3s; }
        .particle:nth-child(8) { left: 80%; animation-delay: 3.5s; }
        .particle:nth-child(9) { left: 90%; animation-delay: 4s; }
        .particle:nth-child(10) { left: 15%; animation-delay: 4.5s; }
        .particle:nth-child(11) { left: 25%; animation-delay: 5s; }
        .particle:nth-child(12) { left: 35%; animation-delay: 5.5s; }
        .particle:nth-child(13) { left: 45%; animation-delay: 6s; }
        .particle:nth-child(14) { left: 55%; animation-delay: 6.5s; }
        .particle:nth-child(15) { left: 65%; animation-delay: 7s; }
        .particle:nth-child(16) { left: 75%; animation-delay: 7.5s; }
        .particle:nth-child(17) { left: 85%; animation-delay: 8s; }
        .particle:nth-child(18) { left: 95%; animation-delay: 8.5s; }
        .particle:nth-child(19) { left: 5%; animation-delay: 9s; }
        .particle:nth-child(20) { left: 85%; animation-delay: 9.5s; }
      `}</style>
    </div>
  );
} 