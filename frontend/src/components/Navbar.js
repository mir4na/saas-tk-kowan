import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiLogOut, FiUser, FiBriefcase } from 'react-icons/fi';
import './Navbar.css';

const Navbar = () => {
  const { user, organization, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar glass-effect">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-logo">
          <div className="logo-icon gradient-text">⚡</div>
          <span className="gradient-text">TaskFlow</span>
        </Link>

        <div className="navbar-menu">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/tasks" className="nav-link">Tasks</Link>
          <Link to="/workspaces" className="nav-link">Workspaces</Link>
          {user?.role === 'admin' && (
            <Link to="/team" className="nav-link">Team</Link>
          )}
        </div>

        <div className="navbar-right">
          <div className="user-info">
            <div className="org-badge">
              <FiBriefcase />
              <span>{organization?.name}</span>
            </div>
            <div className="user-badge">
              <FiUser />
              <span>{user?.name}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Logout">
            <FiLogOut />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
