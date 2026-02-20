import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout, isChair } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo">
          <span className="logo-text">AlturaGov</span>
        </Link>

        <div className="navbar-links">
          {isAuthenticated ? (
            <>
              <div className="nav-user-info">
                <span className="nav-user-name">{user?.name ? user.name.split(' ')[0] : 'User'}</span>
                <span className={`nav-role-badge ${isChair ? 'chair' : user?.roles?.[0] || 'member'}`}>
                  {isChair ? 'Chair' : (user?.roles?.[0] ? user.roles[0].charAt(0).toUpperCase() + user.roles[0].slice(1) : 'Member')}
                </span>
              </div>
              <Link to="/command-center" className="nav-link">Command Center</Link>
              <Link to="/strategic-ledger" className="nav-link">Strategic Ledger</Link>
              <Link to="/settings" className="nav-link">Settings</Link>
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
