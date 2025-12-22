import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Choice.css';

function Choice() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  return (
    <div className="choice-container full-center fadeIn">
      <div className="glass-panel">
        <div className="header-choice">
          <h1 className="gradient-text">Welcome, {user?.name}</h1>
          <p className="subtitle">Choose your power tool</p>
        </div>
        
        <div className="cards-row">
          <div className="feature-card" onClick={() => navigate('/quickclip')}>
            <div className="card-icon">📝</div>
            <h3>QuickClip</h3>
            <p>Store and share code snippets securely.</p>
          </div>
          
          <div className="feature-card" onClick={() => navigate('/shortener')}>
            <div className="card-icon">🔗</div>
            <h3>URL Shortener</h3>
            <p>Simplify long links in a click.</p>
          </div>
        </div>

        <button className="logout-button" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

export default Choice;
