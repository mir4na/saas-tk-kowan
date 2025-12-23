import React, { useEffect, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { pasteAPI } from '../services/api';
import PasswordModal from '../components/PasswordModal';
import Modal from '../components/Modal';
import './Paste.css';

const Paste = () => {
  const { slug } = useParams();
  const [paste, setPaste] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showCreatorModal, setShowCreatorModal] = useState(false);

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

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="paste-page">
      {paste && (
        <div className="paste-container">
          <header className="paste-header">
            <h1 className="paste-title">{paste.title}</h1>
            <div className="paste-meta">
              <span className="author-section">
                <span className="author-label">by</span>
                <span 
                  className="author-clickable"
                  onClick={() => setShowCreatorModal(true)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && setShowCreatorModal(true)}
                >
                  <span className="author-avatar">
                    {paste.owner_photo ? (
                      <img src={paste.owner_photo} alt={paste.owner_name || 'User'} />
                    ) : (
                      <span className="author-initials">{getInitials(paste.owner_name)}</span>
                    )}
                  </span>
                  <strong>{paste.owner_name || 'Anonymous'}</strong>
                </span>
              </span>
              <span className="separator">•</span>
              <span className="date">{formatDate(paste.created_at)}</span>
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

          <div className="paste-cta">
            <Link to="/" className="create-paste-link">
              Create your own paste
            </Link>
          </div>
        </div>
      )}
      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => window.location.href = '/'}
        onSubmit={handlePasswordSubmit}
        error={passwordError}
      />
      
      <Modal isOpen={showCreatorModal} onClose={() => setShowCreatorModal(false)}>
        <div className="creator-modal-content">
          <div className="creator-modal-avatar">
            {paste?.owner_photo ? (
              <img src={paste.owner_photo} alt={paste.owner_name || 'User'} />
            ) : (
              <div className="creator-modal-initials">{getInitials(paste?.owner_name)}</div>
            )}
          </div>
          <h2 className="creator-modal-name">{paste?.owner_name || 'Anonymous'}</h2>
          {paste?.owner_description && (
            <p className="creator-modal-description">{paste.owner_description}</p>
          )}
          {!paste?.owner_description && (
            <p className="creator-modal-no-description">No description provided</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Paste;
