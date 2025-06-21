import { Link, NavLink } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../App';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Navbar() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/logout`, {}, {
        withCredentials: true,
      });
      setUser(null);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }

  return (
    <nav className="navbar navbar-expand-lg" style={{ background: '#D2691E', borderRadius: '0.75rem', margin: '1.5rem 0 2rem 0', boxShadow: '0 2px 8px rgba(210, 105, 30, 0.08)' }}>
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold text-white d-flex align-items-center" to="/">
          <span style={{ fontSize: '1.7em', marginRight: 8 }} role="img" aria-label="logo">🚚</span>
          Morres Logistics
        </Link>
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNavbar" aria-controls="mainNavbar" aria-expanded="false" aria-label="Toggle navigation">
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="mainNavbar">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0 align-items-lg-center gap-lg-2">
            <li className="nav-item">
              <NavLink to="/" className={({ isActive }) => 'nav-link' + (isActive ? ' active text-white fw-bold' : ' text-white')}>Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/offerings" className={({ isActive }) => 'nav-link' + (isActive ? ' active text-white fw-bold' : ' text-white')}>Offerings</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/track" className={({ isActive }) => 'nav-link' + (isActive ? ' active text-white fw-bold' : ' text-white')}>Track Delivery</NavLink>
            </li>
            {user && (
              <>
                <li className="nav-item ms-lg-3">
                  <NavLink to="/dashboard" className={({ isActive }) => 'btn btn-light fw-bold px-4 py-2' + (isActive ? ' active' : '')} style={{ color: '#D2691E' }}>Dashboard</NavLink>
                </li>
                <li className="nav-item ms-lg-2">
                  <button className="btn btn-outline-light fw-bold px-4 py-2" style={{ color: '#D2691E' }} onClick={handleLogout}>Logout</button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
} 