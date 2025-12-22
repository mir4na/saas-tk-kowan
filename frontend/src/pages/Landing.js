import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Landing.css';

const Landing = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="landing">
      <header className="landing__nav">
        <div className="brand">Pastebin Mini</div>
        <div className="actions">
          {isAuthenticated ? (
            <>
              <span className="welcome">Hi, {user?.name}</span>
              <Link className="btn" to="/dashboard">Dashboard</Link>
            </>
          ) : (
            <>
              <Link className="link" to="/login">Login</Link>
              <Link className="btn" to="/register">Register</Link>
            </>
          )}
        </div>
      </header>

      <main className="landing__hero">
        <div>
          <p className="eyebrow">Passkey powered</p>
          <h1>Create and share pastes securely</h1>
          <p className="subtitle">
            Login with passkey, craft your paste, and share the link. Only you can edit your own paste.
          </p>
          <div className="hero-actions">
            <Link className="btn" to={isAuthenticated ? '/dashboard' : '/register'}>
              {isAuthenticated ? 'Go to dashboard' : 'Get started'}
            </Link>
          </div>
        </div>
        <div className="hero-card">
          <div className="badge">No passwords</div>
          <p>Passkey login keeps things quick and secure.</p>
          <div className="row">
            <span>Paste access</span>
            <strong>Public link</strong>
          </div>
          <div className="row">
            <span>Edit rights</span>
            <strong>Owner only</strong>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
