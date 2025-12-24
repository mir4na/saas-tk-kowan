import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { pasteAPI } from '../services/api';
import SetPasswordModal from '../components/SetPasswordModal';
import Modal from '../components/Modal';
import './Dashboard.css';

const Dashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [pastes, setPastes] = useState([]);
  const [selectedPaste, setSelectedPaste] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 100000;

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    if (newContent.length <= MAX_CHARS) {
      setContent(newContent);
      setCharCount(newContent.length);
    }
  };
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const loadPastes = useCallback(async () => {
    try {
      const res = await pasteAPI.list();
      setPastes(res.data.data || []);
      if (res.data.data?.length) {
        const first = res.data.data[0];
        setSelectedPaste(first);
        setTitle(first.title);
        setContent(first.content || '');
        setIsPublic(first.is_public);
      }
    } catch (err) {
      console.error('Failed to load pastes', err);
    }
  }, []);

  useEffect(() => {
    loadPastes();
  }, [loadPastes]);

  const createPaste = async () => {
    if (pastes.length >= 10) {
      setShowLimitModal(true);
      return;
    }
    setSaving(true);
    try {
      const res = await pasteAPI.create({ title: 'Untitled Paste', content: '', isPublic: true });
      const newPaste = res.data.data;
      setPastes((prev) => [newPaste, ...prev]);
      setSelectedPaste(newPaste);
      setTitle(newPaste.title);
      setContent(newPaste.content || '');
      setIsPublic(newPaste.is_public);
      setPassword('');
    } catch (err) {
      console.error('Failed to create paste', err);
    } finally {
      setSaving(false);
    }
  };

  const selectPaste = (paste) => {
    setSelectedPaste(paste);
    setTitle(paste.title);
    setContent(paste.content || '');
    setIsPublic(paste.is_public);
    setPassword('');
    setLastSaved(null);
  };

  const savePaste = useCallback(async (overrides = {}) => {
    if (!selectedPaste) return;

    const nextTitle = overrides.title !== undefined ? overrides.title : title;
    const nextContent = overrides.content !== undefined ? overrides.content : content;
    const nextIsPublic = overrides.isPublic !== undefined ? overrides.isPublic : isPublic;
    const nextPassword = overrides.password !== undefined ? overrides.password : password;

    if (!nextIsPublic && !nextPassword && !selectedPaste.has_password) {
      setShowSetPasswordModal(true);
      return;
    }

    setSaving(true);
    try {
      const res = await pasteAPI.update(selectedPaste.slug, {
        title: nextTitle || 'Untitled Paste',
        content: nextContent,
        isPublic: nextIsPublic,
        password: !nextIsPublic && nextPassword ? nextPassword : undefined
      });
      const updated = res.data.data;
      setPastes((prev) => prev.map((p) => (p.slug === selectedPaste.slug ? updated : p)));
      setSelectedPaste((prev) => ({ ...prev, ...updated }));
      setLastSaved(new Date());
    } catch (err) {
      console.error('Failed to save paste', err);
    } finally {
      setSaving(false);
    }
  }, [selectedPaste, title, content, isPublic, password]);

  useEffect(() => {
    if (!selectedPaste) return;

    const timeoutId = setTimeout(() => {
      savePaste();
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [title, content]);

  const copyLink = (slug) => {
    const link = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(link);
  };

  const handleTogglePublic = async (e) => {
    const isNowPublic = e.target.checked;
    if (!isNowPublic) {
      if (!password && !selectedPaste?.has_password) {
        setShowSetPasswordModal(true);
        return;
      }
    }
    setIsPublic(isNowPublic);
    // Auto-save logic for better UX
    await savePaste({ isPublic: isNowPublic });
  };

  const handleSetPassword = async (pass) => {
    setPassword(pass);
    setIsPublic(false);
    setShowSetPasswordModal(false);
    // Immediately sync to database
    await savePaste({ isPublic: false, password: pass });
  };

  const handleQuickclipClick = () => {
    setShowFeatureModal(false);
    navigate('/pastebin');
  };

  const handleShortenerClick = () => {
    setShowFeatureModal(false);
    navigate('/shortener');
  };

  const deleteSelectedPaste = async () => {
    if (!selectedPaste) return;
    setSaving(true);
    try {
      await pasteAPI.remove(selectedPaste.slug);
      setPastes((prev) => prev.filter((p) => p.slug !== selectedPaste.slug));
      const next = pastes.find((p) => p.slug !== selectedPaste.slug) || null;
      if (next) {
        setSelectedPaste(next);
        setTitle(next.title);
        setContent(next.content || '');
        setIsPublic(next.is_public);
      } else {
        setSelectedPaste(null);
        setTitle('');
        setContent('');
        setIsPublic(true);
      }
      setPassword('');
      setLastSaved(null);
      setShowDeleteModal(false);
    } catch (err) {
      console.error('Failed to delete paste', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-topbar">
        <div className="brand-logo">⚡ QUICKCLIP</div>
        <nav className="nav-links">
          <Link to="/" className="app-nav-link">Home</Link>
          <button onClick={() => setShowFeatureModal(true)} className="app-nav-link">Features</button>
          <Link to="/profile" className="app-nav-link">Profile</Link>
          <button onClick={logout} className="app-nav-link logout-link">Logout</button>
        </nav>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <div className="sidebar__header">
            <h3>Your pastes</h3>
            <button className="primary-btn small" onClick={createPaste} disabled={saving}>
              + New
            </button>
          </div>
          <div className="list">
            {pastes.length === 0 && <p className="muted">No pastes yet.</p>}
            {pastes.map((p) => (
              <div
                key={p.slug}
                className={`list-item ${selectedPaste?.slug === p.slug ? 'active' : ''}`}
                onClick={() => selectPaste(p)}
              >
                <div>
                  <div className="title">{p.title || 'Untitled'}</div>
                  <div className="muted small">/{p.slug}</div>
                </div>
                <button className="ghost small" onClick={(e) => { e.stopPropagation(); copyLink(p.slug); }}>
                  Copy link
                </button>
              </div>
            ))}
          </div>
        </aside>

        <main className="editor">
          {selectedPaste ? (
            <>
              <div className="editor__header">
                <input
                  className="title-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Paste title"
                />
                <div className="editor__controls">
                  <div className="controls-actions">
                    <div className="toggle-switch-wrapper" onClick={() => handleTogglePublic({ target: { checked: !isPublic } })}>
                      <div className={`toggle-switch ${isPublic ? 'active' : ''}`}>
                        <div className="toggle-knob"></div>
                      </div>
                      <span className="toggle-label">{isPublic ? 'Public' : 'Private'}</span>
                    </div>

                    {!isPublic && (
                      <button
                        className="ghost change-pass-btn"
                        onClick={() => setShowSetPasswordModal(true)}
                      >
                        Change Password
                      </button>
                    )}

                    <button className="ghost danger-btn" onClick={() => setShowDeleteModal(true)} disabled={saving}>
                      Delete
                    </button>
                  </div>
                </div>
                <div className="editor__status">
                      {saving ? 'Saving changes…' : lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString()}` : 'All changes auto-saved'}
                </div>
              </div>
              <textarea
                className="editor__textarea"
                value={content}
                onChange={handleContentChange}
                placeholder="Write your paste here..."
              />
              <div className="char-counter" style={{
                textAlign: 'right',
                fontSize: '0.85rem',
                color: charCount > MAX_CHARS * 0.9 ? 'var(--primary-pink)' : 'rgba(255, 255, 255, 0.5)',
                marginTop: '8px'
              }}>
                {charCount} / {MAX_CHARS} characters
              </div>
            </>
          ) : (
            <div className="empty-state">
              <h2>No paste selected</h2>
              <p className="muted">Create a paste to start editing.</p>
            </div>
          )}
        </main>
      </div>
      <SetPasswordModal
        isOpen={showSetPasswordModal}
        onClose={() => setShowSetPasswordModal(false)}
        onSet={handleSetPassword}
        hasPassword={selectedPaste?.has_password || !!password}
      />
      <Modal isOpen={showLimitModal} onClose={() => setShowLimitModal(false)}>
        <div className="feature-selection">
          <h2>Limit Reached</h2>
          <p>You can only create up to 10 pastebins.</p>
        </div>
      </Modal>
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
        <div className="feature-selection">
          <h2>Delete paste?</h2>
          <p>This action cannot be undone.</p>
          <div className="feature-options">
            <button className="ghost" onClick={() => setShowDeleteModal(false)} disabled={saving}>
              Cancel
            </button>
            <button className="primary-btn danger-btn-filled" onClick={deleteSelectedPaste} disabled={saving}>
              {saving ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
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

export default Dashboard;
