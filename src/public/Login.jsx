import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { setIsAuthenticated } = useContext(AuthContext);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const res = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ username: email, password }),
    });
    if (res.ok) {
      setIsAuthenticated(true);
      navigate('/dashboard');
    } else {
      const data = await res.json();
      setError(data.error || 'Login failed');
    }
  }

  return (
    <div className="container d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
      <div className="card shadow-sm border-0 p-4 w-100" style={{ maxWidth: 400, background: 'rgba(255,255,255,0.97)' }}>
        <div className="text-center mb-3">
          <span className="material-icons fs-1 mb-2" style={{ color: '#D2691E' }}>login</span>
          <h1 className="h3 fw-bold mb-3" style={{ color: '#a14e13' }}>Operator Login</h1>
        </div>
        <form className="w-100" onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="email" className="form-label fw-semibold">Username</label>
            <input id="email" type="text" className="form-control" placeholder="operator" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="mb-3">
            <label htmlFor="password" className="form-label fw-semibold">Password</label>
            <input id="password" type="password" className="form-control" placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn w-100 text-white fw-bold" style={{ background: '#D2691E' }}>Login</button>
        </form>
        {error && <div className="alert alert-danger mt-3">{error}</div>}
        <div className="text-center mt-4">
          <Link to="/" className="text-decoration-underline" style={{ color: '#D2691E' }}>&larr; Back to Home</Link>
        </div>
      </div>
    </div>
  );
} 