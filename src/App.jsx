import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './operator/Dashboard';
import TrackDelivery from './customer/TrackDelivery';
import Navbar from './public/Navbar';
import Landing from './public/Landing';
import Offerings from './public/Offerings';
import Login from './public/Login';
import Footer from './public/Footer';
import './App.css'
import { useState, createContext } from 'react';

export const AuthContext = createContext();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/track" element={<TrackDelivery />} />
          <Route path="/offerings" element={<Offerings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Landing />} />
          {/* Future: <Route path="/login" element={<Login />} /> */}
        </Routes>
        <Footer />
      </Router>
    </AuthContext.Provider>
  );
}
