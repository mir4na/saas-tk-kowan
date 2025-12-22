import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pasteAPI, profileAPI } from '../services/api';
import ProfileEditModal from '../components/ProfileEditModal';
import SetPasswordModal from '../components/SetPasswordModal';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const [pastes, setPastes] = useState([]);
  const [selectedPaste, setSelectedPaste] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [charCount, setCharCount] = useState(0);
  const MAX_CHARS = 1024;

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
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const fileInputRef = useRef(null);

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
      setDirty(false);
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
    setDirty(false);
  };

  const savePaste = useCallback(async (overrides = {}) => {
    if (!selectedPaste) return;
    
    // Determine values to save: use overrides if provided, otherwise current state
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
      setDirty(false);
    } catch (err) {
      console.error('Failed to save paste', err);
    } finally {
      setSaving(false);
    }
  }, [selectedPaste, title, content, isPublic, password]);

  useEffect(() => {
    if (!selectedPaste) return;
    setDirty(true);
  }, [title, content, isPublic, password, selectedPaste]);

  const copyLink = (slug) => {
    const link = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(link);
  };

  const handleProfileSave = async ({ name, photoFile }) => {
    setAvatarUploading(true);
    try {
      if (photoFile) {
        const formData = new FormData();
        formData.append('photo', photoFile);
        const photoRes = await profileAPI.updatePhoto(formData);
        updateUser(photoRes.data.data.user);
      }
      
      if (name && name !== user.name) {
        const nameRes = await profileAPI.updateName({ name });
        updateUser(nameRes.data.data.user);
      }
      
      setShowProfileModal(false);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setAvatarUploading(false);
    }
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

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="brand" onClick={() => window.location.href = '/'} style={{cursor: 'pointer'}}>
           QuickClip Mini <span style={{fontSize: '0.6em', opacity: 0.7}}>// Feature</span>
        </div>
        <div className="user-area">
          <button className="neon-button small" style={{marginRight: '20px'}} onClick={() => window.location.href='/'}>
             Back to Menu
          </button>
          <div className="avatar">
            {user.profilePhoto ? <img src={user.profilePhoto} alt="avatar" /> : <span>{user.name?.[0] || '?'}</span>}
          </div>
          <div className="user-meta">
            <strong>{user.name}</strong>
            <div className="user-actions">
              <button className="link" onClick={() => setShowProfileModal(true)}>Edit profile</button>
              <button className="link" onClick={logout}>Logout</button>
            </div>
          </div>
        </div>
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
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={handleTogglePublic}
                    />
                    <span>{isPublic ? 'Public' : 'Private'}</span>
                  </label>
                  {!isPublic && (
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Set password (required for private)"
                      style={{
                        padding: '8px 12px',
                        fontSize: '0.9rem',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid rgba(0, 217, 255, 0.3)',
                        borderRadius: '8px',
                        color: 'white',
                        outline: 'none',
                        minWidth: '200px'
                      }}
                    />
                  )}
                  <button className="ghost" onClick={() => copyLink(selectedPaste.slug)}>Share link</button>
                  <button className="primary-btn" onClick={savePaste} disabled={saving || !dirty}>
                    {saving ? 'Saving…' : dirty ? 'Save changes' : 'Saved'}
                  </button>
                  <span className="muted small">
                    {saving ? 'Saving…' : lastSaved ? `Saved at ${lastSaved.toLocaleTimeString()}` : dirty ? 'Unsaved changes' : 'Up to date'}
                  </span>
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
      />
      <ProfileEditModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        user={user}
        onSave={handleProfileSave}
        uploading={avatarUploading}
      />
    </div>
  );
};

export default Dashboard;
