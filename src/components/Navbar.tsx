import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">WeDecide</span>
        </Link>

        <div className="navbar-links">
          {isAuthenticated ? (
            <>
              <div className="nav-user-info">
                <span className="nav-user-name">{user?.name ? user.name.split(' ')[0] : 'User'}</span>
              </div>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/decisions" className="nav-link">Decisions</Link>
              <Link to="/meetings" className="nav-link">Meetings</Link>
              <Button variant="ghost" size="sm" onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup">
                <Button variant="primary" size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};
