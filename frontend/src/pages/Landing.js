import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Landing.css';

const Landing = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [showLoginConfirmation, setShowLoginConfirmation] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const handleGetStarted = () => {
    if (user) {
      navigate('/notes');
    } else {
      setShowLoginConfirmation(true);
    }
  };

  const handleConfirmLogin = (hasAccount) => {
    setShowLoginConfirmation(false);
    if (hasAccount) {
      navigate('/login');
    } else {
      navigate('/register');
    }
  };

  const closeConfirmation = () => {
    setShowLoginConfirmation(false);
  };

  const goToLogin = () => {
    navigate('/login');
  };

  const goToRegister = () => {
    navigate('/register');
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="landing-container">
      {/* Navbar */}
      <nav className="landing-navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <span className="navbar-logo">📝</span>
            <span className="navbar-title">NOTTU</span>
          </div>

          <div className="navbar-actions">
            <button onClick={toggleTheme} className="navbar-theme-toggle" title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
              {theme === 'light' ? '🌙' : '💚'}
            </button>

            {user ? (
              <div className="navbar-user-section">
                <span className="navbar-user-name">👤 {user.name}</span>
                <button onClick={handleLogout} className="navbar-btn navbar-btn-logout">
                  Logout
                </button>
              </div>
            ) : (
              <div className="navbar-auth-buttons">
                <button onClick={goToLogin} className="navbar-btn navbar-btn-login">
                  Sign In
                </button>
                <button onClick={goToRegister} className="navbar-btn navbar-btn-register">
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <div className="logo-section">
            <div className="logo-icon">📝</div>
            <h1 className="brand-name">NOTTU</h1>
          </div>
          <p className="brand-subtitle">Neural Optimal Text Terminal Unit</p>
          <p className="hero-description">
            Your intelligent cloud-based note-taking platform with advanced cyber security
            and real-time auto-save technology.
          </p>

          <div className="cta-buttons">
            <button onClick={handleGetStarted} className="btn-get-started">
              Get Started
            </button>
          </div>

          <div className="stats-row">
            <div className="stat-item">
              <div className="stat-number">99.9%</div>
              <div className="stat-label">Uptime</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">2s</div>
              <div className="stat-label">Auto-save</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">∞</div>
              <div className="stat-label">Storage</div>
            </div>
          </div>
        </div>

        {/* Animated Background Elements */}
        <div className="hero-bg-elements">
          <div className="floating-note floating-note-1">📄</div>
          <div className="floating-note floating-note-2">📋</div>
          <div className="floating-note floating-note-3">🗒️</div>
          <div className="floating-note floating-note-4">📓</div>
        </div>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <h2 className="section-title">Powerful Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💾</div>
            <h3>Auto-Save</h3>
            <p>Your notes are automatically saved every 2 seconds. Never lose your work again.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">☁️</div>
            <h3>Cloud Sync</h3>
            <p>Access your notes from anywhere, on any device. Always in sync.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3>Secure</h3>
            <p>Enterprise-grade encryption keeps your data safe and private.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Fast & Responsive</h3>
            <p>Lightning-fast performance with real-time updates and smooth animations.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>Beautiful UI</h3>
            <p>Cyber-themed interface with light and dark modes for comfortable writing.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Mobile Ready</h3>
            <p>Fully responsive design works perfectly on all screen sizes.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="landing-footer">
        <p>&copy; 2025 NOTTU. All rights reserved.</p>
      </div>

      {/* Login Confirmation Popup */}
      {showLoginConfirmation && (
        <div className="popup-overlay" onClick={closeConfirmation}>
          <div className="popup-container" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <h3>Welcome to NOTTU!</h3>
              <button className="popup-close" onClick={closeConfirmation}>
                ✕
              </button>
            </div>
            <div className="popup-content">
              <p>Do you already have an account?</p>
            </div>
            <div className="popup-actions">
              <button
                className="popup-btn popup-btn-primary"
                onClick={() => handleConfirmLogin(true)}
              >
                Yes, I have an account
              </button>
              <button
                className="popup-btn popup-btn-secondary"
                onClick={() => handleConfirmLogin(false)}
              >
                No, create new account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Landing;
