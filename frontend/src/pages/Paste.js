import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { pasteAPI } from '../services/api';
import PasswordModal from '../components/PasswordModal';
import './Paste.css';

const Paste = () => {
  const { slug } = useParams();
  const [paste, setPaste] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await pasteAPI.get(slug);
        setPaste(res.data.data);
      } catch (err) {
        if (err.response?.data?.requiresPassword) {
          setShowPasswordModal(true);
          setLoading(false);
        } else {
          setError('Paste not found');
          console.error(err);
          setLoading(false);
        }
      } finally {
        if (!showPasswordModal) {
          setLoading(false);
        }
      }
    };
    load();
  }, [slug]);

  const handlePasswordSubmit = async (password) => {
    setPasswordError('');
    try {
      const res = await pasteAPI.verifyPassword(slug, password);
      setPaste(res.data.data);
      setShowPasswordModal(false);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Incorrect password');
    }
  };

  if (loading) return <div className="full-center"><div className="spinner" /></div>;
  if (error) return <Navigate to="/resources-not-found" replace />;

  return (
    <div className="paste-page">
      {paste && (
        <div className="paste-container">
          <header className="paste-header">
            <span className="eyebrow">QuickClip Mini</span>
            <h1 className="paste-title">{paste.title}</h1>
            <div className="paste-meta">
              <span className="author">
                by <strong>{paste.owner_name || 'Anonymous'}</strong>
              </span>
              <span className="separator">•</span>
              <span className="date">{new Date(paste.created_at).toLocaleDateString()}</span>
              <span className="separator">•</span>
              <span className={`pill ${paste.is_public ? 'public' : 'private'}`}>
                {paste.is_public ? 'Public' : 'Private'}
              </span>
            </div>
          </header>
          
          <article className="paste-content">
            <div className="line-numbers">
              {paste.content?.split('\n').map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
            <pre>{paste.content || 'No content'}</pre>
          </article>
          
          <footer className="paste-footer">
            <Link to="/" className="home-link">
              ← Create your own paste
            </Link>
          </footer>
        </div>
      )}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => window.location.href = '/'}
        onSubmit={handlePasswordSubmit}
        error={passwordError}
      />
    </div>
  );
};

export default Paste;
