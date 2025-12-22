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
        <>
          <header className="paste-header">
            <div>
              <p className="eyebrow">QuickClip Mini</p>
              <h1>{paste.title}</h1>
              <div className="muted small">/{paste.slug}</div>
            </div>
            <div className="pill">{paste.is_public ? 'Public' : 'Private'}</div>
          </header>
          <article className="paste-content">
            <pre>{paste.content || 'No content'}</pre>
          </article>
          <footer className="paste-footer">
            <Link to="/">Back to home</Link>
          </footer>
        </>
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
