import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import './Landing.css';

const Landing = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [particles, setParticles] = useState([]);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const carouselRef = useRef(null);
  const hasCenteredRef = useRef(false);
  const animationRef = useRef(null);

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

  const handleQuickclipClick = () => {
    setShowFeatureModal(false);
    navigate('/pastebin');
  };

  const handleShortenerClick = () => {
    setShowFeatureModal(false);
    navigate('/shortener');
  };

  const features = useMemo(() => ([
    {
      icon: '📝',
      title: 'Pastebin',
      description: 'Create and share code snippets instantly with clean, readable formatting.',
    },
    {
      icon: '🔗',
      title: 'Smart Shortener',
      description: 'Generate short links for anything you share, with simple, fast redirects.',
    },
    {
      icon: '🔐',
      title: 'Passkey Login',
      description: 'Sign in with WebAuthn passkeys for secure, passwordless access.',
    },
    {
      icon: '🛡️',
      title: 'Private by Default',
      description: 'Your content stays protected with secure sessions and access controls.',
    },
    {
      icon: '⚡',
      title: 'Built for Speed',
      description: 'Fast load times and responsive UI so sharing never slows you down.',
    },
    {
      icon: '🧭',
      title: 'Quick Access',
      description: 'Jump between pastes and links from one simple dashboard.',
    },
  ]), []);

  const extendedFeatures = useMemo(() => (
    [...features, ...features, ...features]
  ), [features]);

  useEffect(() => {
    if (!carouselRef.current || hasCenteredRef.current) {
      return;
    }

    const centerTrack = () => {
      if (!carouselRef.current) {
        return;
      }

      const oneSetWidth = carouselRef.current.scrollWidth / 3;
      carouselRef.current.scrollLeft = oneSetWidth;
      hasCenteredRef.current = true;
    };

    const frameId = requestAnimationFrame(centerTrack);
    return () => cancelAnimationFrame(frameId);
  }, []);

  const normalizeLoop = () => {
    if (!carouselRef.current) {
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    const oneSetWidth = scrollWidth / 3;
    const maxScrollLeft = scrollWidth - clientWidth;
    const minThreshold = oneSetWidth * 0.25;
    const maxThreshold = oneSetWidth * 1.75;

    if (maxScrollLeft <= 0) {
      return;
    }

    if (scrollLeft <= minThreshold) {
      carouselRef.current.scrollLeft = scrollLeft + oneSetWidth;
    } else if (scrollLeft >= maxThreshold) {
      carouselRef.current.scrollLeft = scrollLeft - oneSetWidth;
    }
  };

  const handleCarouselScroll = () => {
    normalizeLoop();
  };

  useEffect(() => {
    if (!carouselRef.current) {
      return undefined;
    }

    let lastTime = performance.now();
    const speed = 0.08;

    const tick = time => {
      if (!carouselRef.current) {
        return;
      }

      const delta = time - lastTime;
      lastTime = time;
      carouselRef.current.scrollLeft += delta * speed;
      normalizeLoop();
      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

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
        <div className="brand-logo">⚡ QUICKCLIP</div>
        <nav className="nav-links">
          {isAuthenticated ? (
            <>
              <button onClick={() => setShowFeatureModal(true)} className="app-nav-link">Features</button>
              <button onClick={logout} className="app-nav-link logout-link">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="app-nav-link">Login</Link>
              <Link to="/register" className="app-nav-link">Register</Link>
            </>
          )}
        </nav>
      </header>

      <main className="landing-hero">
        <h1 className="hero-title">Powering the Future of Productivity</h1>
        <p className="hero-subtitle">
          Secure, lightning-fast tools for modern teams. Share code snippets instantly 
          and create smart short links with secure access controls.
        </p>
        <button className="cta-button" onClick={handleGetStarted}>
          Get Started
        </button>
      </main>

      <section className="features-section">
        <h2 className="section-title">Why Choose QuickClip?</h2>
        <div className="features-carousel">
          <div
            className="features-track"
            ref={carouselRef}
            onScroll={handleCarouselScroll}
          >
            {extendedFeatures.map((feature, index) => (
              <div className="feature-card" key={`${feature.title}-${index}`}>
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2 className="cta-title">Ready to Transform Your Workflow?</h2>
        <p className="cta-text">
          Join thousands of developers and teams already using QuickClip to streamline their productivity.
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
            <div className="feature-option" onClick={handleQuickclipClick}>
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

    </div>
  );
};

export default Landing;
