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
      navigate('/dashboard');
    } catch (err) {
      setError('Login failed. Please ensure your passkey is registered.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth-card">
        <h1>Login</h1>
        <p className="muted">Use your passkey to sign in.</p>
        <form onSubmit={handleSubmit}>
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          {error && <div className="error">{error}</div>}

          <button className="primary-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login with Passkey'}
          </button>
        </form>
        <p className="muted small">No account? <Link to="/register">Register</Link></p>
      </div>
    </div>
  );
};

export default Login;
