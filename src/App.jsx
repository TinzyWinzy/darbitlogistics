import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './operator/Dashboard';
import TrackDelivery from './customer/TrackDelivery';
import Navbar from './public/Navbar';
import Landing from './public/Landing';
import Offerings from './public/Offerings';
import Login from './public/Login';
import Footer from './public/Footer';
import './App.css'
import { useState, createContext, useEffect, useContext } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  
  if (loading) {
    return <div className="d-flex justify-content-center p-5">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Try to fetch deliveries as an auth check
        await axios.get(`${import.meta.env.VITE_API_URL}/deliveries`, {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        });
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, loading }}>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/track" element={<TrackDelivery />} />
          <Route path="/offerings" element={<Offerings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Landing />} />
        </Routes>
        <Footer />
      </Router>
    </AuthContext.Provider>
  );
}
