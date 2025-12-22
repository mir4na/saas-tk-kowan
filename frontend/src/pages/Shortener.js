import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Modal from '../components/Modal';
import './Shortener.css';

function Shortener() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [originalUrl, setOriginalUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [urls, setUrls] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState('');
  const [listError, setListError] = useState('');
  const [editOriginalUrl, setEditOriginalUrl] = useState('');
  const [editName, setEditName] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [deleteLoadingId, setDeleteLoadingId] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const copyTimeoutRef = useRef(null);

  const baseUrl = useMemo(() => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${protocol}//${hostname}${port}`;
  }, []);

  const maxUrls = 5;
  const remainingSlots = Math.max(0, maxUrls - urls.length);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const fetchUrls = async () => {
      setListLoading(true);
      setListError('');
      try {
        const response = await api.get('/urls');
        setUrls(response.data.data || []);
      } catch (err) {
        console.error(err);
        setListError('Unable to load your short links right now.');
      } finally {
        setListLoading(false);
      }
    };

    fetchUrls();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (urls.length >= maxUrls) {
      setError('You have reached the 5-link limit.');
      return;
    }

    setLoading(true);
    setError('');
    setShortUrl('');
    setCopyStatus('');

    try {
      const response = await api.post('/urls', {
        originalUrl,
        name: linkName.trim()
      });
      const { short_code } = response.data.data;
      const generatedUrl = `${baseUrl}/u/${short_code}`;
      setShortUrl(generatedUrl);
      setUrls((prev) => [response.data.data, ...prev]);
      setOriginalUrl('');
      setLinkName('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to shorten URL');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (item) => {
    setEditItem(item);
    setEditOriginalUrl(item.original_url);
    setEditName(item.name || '');
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setEditItem(null);
    setEditOriginalUrl('');
    setEditName('');
    setShowEditModal(false);
  };

  const saveEdit = async (id) => {
    if (!editOriginalUrl.trim()) {
      return;
    }
    setEditSaving(true);
    setListError('');
    try {
      const response = await api.put(`/urls/${id}`, {
        originalUrl: editOriginalUrl.trim(),
        name: editName.trim()
      });
      const updated = response.data.data;
      setUrls((prev) => prev.map((item) => (item.id === id ? updated : item)));
      closeEditModal();
    } catch (err) {
      console.error(err);
      setListError(err.response?.data?.message || 'Failed to update short link.');
    } finally {
      setEditSaving(false);
    }
  };

  const deleteUrl = async (id) => {
    setDeleteLoadingId(id);
    setListError('');
    try {
      await api.delete(`/urls/${id}`);
      setUrls((prev) => prev.filter((item) => item.id !== id));
      if (editItem && editItem.id === id) {
        closeEditModal();
      }
    } catch (err) {
      console.error(err);
      setListError(err.response?.data?.message || 'Failed to delete short link.');
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const copyToClipboard = async () => {
    if (!shortUrl) {
      return;
    }

    const copyWithFallback = () => {
      const textarea = document.createElement('textarea');
      textarea.value = shortUrl;
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copied;
    };

    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(shortUrl);
        copied = true;
      } catch (err) {
        console.error(err);
      }
    }

    if (!copied) {
      copied = copyWithFallback();
    }

    if (copied) {
      setCopyStatus('Successfully Copied');
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopyStatus('');
      }, 1500);
    }
  };

  const copyListUrl = async (shortCode, id) => {
    const urlToCopy = `${baseUrl}/u/${shortCode}`;
    
    const copyWithFallback = () => {
      const textarea = document.createElement('textarea');
      textarea.value = urlToCopy;
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copied;
    };

    let copied = false;
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(urlToCopy);
        copied = true;
      } catch (err) {
        console.error(err);
      }
    }

    if (!copied) {
      copied = copyWithFallback();
    }

    if (copied) {
      setCopiedId(id);
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
      copyTimeoutRef.current = setTimeout(() => {
        setCopiedId(null);
      }, 2000);
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

  return (
    <div className="shortener-page">
      <header className="shortener-topbar">
        <div className="brand-logo">⚡ QUICKCLIP</div>
        <nav className="nav-links">
          <Link to="/" className="app-nav-link">Home</Link>
          <button onClick={() => setShowFeatureModal(true)} className="app-nav-link">Features</button>
          <button onClick={logout} className="app-nav-link logout-link">Logout</button>
        </nav>
      </header>

      <div className="shortener-container-wrapper">
        <div className="shortener-sidebar">
        <div className="sidebar-card">
          <div className="shortener-list-header">
            <h3>Your links</h3>
            <span>{urls.length} / {maxUrls}</span>
          </div>

          {listError && <p className="error-text">{listError}</p>}

          {listLoading ? (
            <p className="muted-text">Loading your links...</p>
          ) : urls.length === 0 ? (
            <p className="muted-text">No links yet.</p>
          ) : (
            <div className="shortener-list">
              {urls.map((item) => {
                const shortLink = `${baseUrl}/u/${item.short_code}`;
                const displayName = item.name || 'Untitled Link';

                return (
                  <div className="shortener-row-wrapper" key={item.id}>
                    <button
                      className="shortener-row"
                      type="button"
                      onClick={() => openEditModal(item)}
                    >
                      <div className="shortener-row-main">
                        <span className="shortener-name">{displayName}</span>
                        <span className="shortener-row-link">{shortLink}</span>
                      </div>
                      <span className="shortener-row-destination">{item.original_url}</span>
                      <span className="tap-to-edit">TAP TO EDIT</span>
                    </button>
                    <button
                      className="copy-list-button"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        copyListUrl(item.short_code, item.id);
                      }}
                    >
                      {copiedId === item.id ? (
                        <span className="copied-indicator">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M13.5 4L6 11.5L2.5 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Copied
                        </span>
                      ) : (
                        'Copy'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

        <div className="shortener-main">
        <div className="glass-card">
          <div className="shortener-header">
            <div>
              <h2 className="gradient-text">URL Shortener</h2>
              <p className="shortener-subtitle">
                Build short links you can edit later. {remainingSlots} of {maxUrls} slots left.
              </p>
            </div>
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="shortener-panel-create">
            <h3>Create a new short link</h3>
            <form onSubmit={handleSubmit} className="shortener-form">
              <input
                type="text"
                className="futuristic-input"
                placeholder="Name this link (optional)"
                value={linkName}
                onChange={(e) => setLinkName(e.target.value.slice(0, 30))}
                maxLength={30}
              />
              <input
                type="url"
                className="futuristic-input"
                placeholder="Enter long URL here..."
                value={originalUrl}
                onChange={(e) => setOriginalUrl(e.target.value)}
                required
              />
              <button type="submit" className="neon-button" disabled={loading || urls.length >= maxUrls}>
                {loading ? 'Shortening...' : urls.length >= maxUrls ? 'Limit Reached' : 'Shorten'}
              </button>
            </form>

            {shortUrl && (
              <div className="result-container">
                <p>Your shortened link:</p>
                <div className="short-url-box">
                  {copyStatus ? (
                    <span className="short-link">{copyStatus}</span>
                  ) : (
                    <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="short-link">
                      {shortUrl}
                    </a>
                  )}
                  <button onClick={copyToClipboard} className="icon-button">
                    Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>

      <Modal isOpen={showEditModal} onClose={closeEditModal}>
        {editItem && (
          <div className="shortener-modal">
            <h3>Edit Short Link</h3>
            <div className="shortener-modal-meta">
              <span className="shortener-label">Short link</span>
              <span className="short-link">{baseUrl}/u/{editItem.short_code}</span>
            </div>
            <label className="field-label">Link name</label>
            <input
              className="futuristic-input"
              value={editName}
              onChange={(e) => setEditName(e.target.value.slice(0, 30))}
              type="text"
              maxLength={30}
              placeholder="Add a name (optional)"
            />
            <label className="field-label">Destination URL</label>
            <input
              className="futuristic-input"
              value={editOriginalUrl}
              onChange={(e) => setEditOriginalUrl(e.target.value)}
              type="url"
              required
            />
            <div className="shortener-modal-actions">
              <button
                className="secondary-button"
                type="button"
                onClick={() => saveEdit(editItem.id)}
                disabled={editSaving}
              >
                {editSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                className="danger-button"
                type="button"
                onClick={() => deleteUrl(editItem.id)}
                disabled={deleteLoadingId === editItem.id}
              >
                {deleteLoadingId === editItem.id ? 'Deleting...' : 'Delete'}
              </button>
              <button className="ghost-button" type="button" onClick={closeEditModal}>
                Cancel
              </button>
            </div>
          </div>
        )}
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
}

export default Shortener;
