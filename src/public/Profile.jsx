import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { FaUserCircle } from 'react-icons/fa';

export default function Profile() {
  const { user } = useContext(AuthContext);
  if (!user) return null;
  return (
    <div className="container py-5">
      <div className="card mx-auto" style={{ maxWidth: 400 }}>
        <div className="card-body text-center">
          <FaUserCircle size={64} className="mb-3 text-secondary" />
          <h4 className="card-title mb-2">{user.name || user.username || user.email}</h4>
          <p className="card-text mb-1"><strong>Email:</strong> {user.email || user.username}</p>
          <p className="card-text mb-1"><strong>Role:</strong> {user.role}</p>
          {/* Add more user info as needed */}
        </div>
      </div>
    </div>
  );
} 