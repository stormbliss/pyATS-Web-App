import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Testbeds from './components/Testbeds';
import TestbedUpload from './components/TestbedUpload';
import TestbedGenerator from './components/TestbedGenerator';
import DeviceManager from './components/DeviceManager';
import Learn from './components/Learn';
import Diff from './components/Diff';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        {isAuthenticated ? (
          <>
            <nav className="navbar">
              <div className="nav-brand">
                <h1>PyATS Web App</h1>
              </div>
              <div className="nav-links">
                <a href="/">Dashboard</a>
                <a href="/testbeds">Testbeds</a>
                <button onClick={handleLogout} className="btn-logout">Logout</button>
              </div>
            </nav>
            <div className="content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/testbeds" element={<Testbeds />} />
                <Route path="/testbeds/upload" element={<TestbedUpload />} />
                <Route path="/testbeds/generate" element={<TestbedGenerator />} />
                <Route path="/devices/:testbedId" element={<DeviceManager />} />
                <Route path="/learn/:testbedId" element={<Learn />} />
                <Route path="/diff/:snapshot1Id/:snapshot2Id" element={<Diff />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </>
        ) : (
          <Routes>
            <Route path="/login" element={<Login onLogin={handleLogin} />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
