import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import db from '../services/db';

export function useUserMenu() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      localStorage.removeItem('jwt_token');
      setUser(null);
      
      // Clear IndexedDB tables to prevent data leaks between operators
      await db.deliveries.clear();
      await db.parentBookings.clear();
      await db.outbox.clear();
      
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Fallback to basic logout if IndexedDB clear fails
      localStorage.removeItem('jwt_token');
      setUser(null);
      navigate('/login');
    }
  };

  return { user, handleLogout };
} 