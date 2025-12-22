import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import ShortenerModal from '../components/ShortenerModal';
import ThemeToggle from '../components/ThemeToggle';
import './Landing.css';

const Landing = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [particles, setParticles] = useState([]);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showShortenerModal, setShowShortenerModal] = useState(false);

  useEffect(() => {
    const newParticles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      size: Math.random() * 4 + 1,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 20,
    }));
    setParticles(newParticles);
  }, []);

  const handleGetStarted = () => {
    if (isAuthenticated) {
      setShowFeatureModal(true);
    } else {
      navigate('/login');
    }
  };

  const handlePastebinClick = () => {
    setShowFeatureModal(false);
    navigate('/pastebin');
  };

  const handleShortenerClick = () => {
    setShowFeatureModal(false);
    setShowShortenerModal(true);
  };

  return (
    <div className="landing-page">
      <div className="particles-bg">
        {particles.map(p => (
          <div
            key={p.id}
            className="particle"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <header className="landing-header">
        <div className="brand-logo">⚡ PASTEBIN</div>
        <nav className="nav-links">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              <button onClick={() => setShowFeatureModal(true)} className="nav-link">Features</button>
              <button onClick={logout} className="nav-link logout-link">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="nav-link">Register</Link>
            </>
          )}
        </nav>
      </header>

      <main className="landing-hero">
        <h1 className="hero-title">Powering the Future of Productivity</h1>
        <p className="hero-subtitle">
          Secure, lightning-fast tools for modern teams. Share code snippets instantly 
          and create smart short links with military-grade encryption.
        </p>
        <button className="cta-button" onClick={handleGetStarted}>
          Get Started
        </button>
      </main>

      <section className="features-section">
        <h2 className="section-title">Why Choose Pastebin?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔐</div>
            <h3 className="feature-title">Quantum Security</h3>
            <p className="feature-description">
              Military-grade encryption with WebAuthn passkeys. No passwords, no breaches. 
              Your data is protected by the latest cryptographic standards.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3 className="feature-title">Lightning Fast</h3>
            <p className="feature-description">
              Edge computing and neural caching deliver instant responses worldwide. 
              Experience zero-latency collaboration across continents.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔗</div>
            <h3 className="feature-title">Smart Links</h3>
            <p className="feature-description">
              AI-optimized URL shortening with predictive analytics. Track clicks, 
              manage expiry, and gain insights into your link performance.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3 className="feature-title">Code Sharing</h3>
            <p className="feature-description">
              Share code snippets with syntax highlighting and version control. 
              Collaborate with your team in real-time with instant updates.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <h3 className="feature-title">Global CDN</h3>
            <p className="feature-description">
              Content delivered from 200+ edge locations worldwide. 
              Your pastes and links load instantly, anywhere on Earth.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Analytics Dashboard</h3>
            <p className="feature-description">
              Real-time insights into your content performance. Track views, 
              geographic distribution, and engagement metrics.
            </p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2 className="cta-title">Ready to Transform Your Workflow?</h2>
        <p className="cta-text">
          Join thousands of developers and teams already using Pastebin to streamline their productivity.
        </p>
        <button className="cta-button-secondary" onClick={handleGetStarted}>
          Start Free Today
        </button>
      </section>
      
      <footer className="landing-footer">
        <p>Made by <strong>Claude Computing</strong></p>
      </footer>

      <Modal isOpen={showFeatureModal} onClose={() => setShowFeatureModal(false)}>
        <div className="feature-selection">
          <h2>Choose Your Tool</h2>
          <p>Select a feature to get started</p>
          <div className="feature-options">
            <div className="feature-option" onClick={handlePastebinClick}>
              <div className="feature-option-icon">📝</div>
              <div className="feature-option-title">Pastebin</div>
              <p className="feature-option-desc">Share code snippets</p>
            </div>
            <div className="feature-option" onClick={handleShortenerClick}>
              <div className="feature-option-icon">🔗</div>
              <div className="feature-option-title">URL Shortener</div>
              <p className="feature-option-desc">Create short links</p>
            </div>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showShortenerModal} onClose={() => setShowShortenerModal(false)}>
        <ShortenerModal />
      </Modal>
    </div>
  );
};

export default Landing;
