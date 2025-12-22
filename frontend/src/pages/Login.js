import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email);
      navigate('/');
    } catch (err) {
      setError('Login failed. Please ensure your passkey is registered.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Access your quantum-secured workspace</p>
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <input
              type="email"
              required
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? '⚡ Authenticating...' : '🔐 Login with Passkey'}
          </button>
        </form>
        
        <div className="auth-footer">
          Don't have an account?
          <Link to="/register" className="auth-link">Create One</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
