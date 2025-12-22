import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { pasteAPI, profileAPI } from '../services/api';
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
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
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
    setLastSaved(null);
    setDirty(false);
  };

  const savePaste = useCallback(async () => {
    if (!selectedPaste) return;
    setSaving(true);
    try {
      const res = await pasteAPI.update(selectedPaste.slug, {
        title: title || 'Untitled Paste',
        content,
        isPublic
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
  }, [selectedPaste, title, content, isPublic]);

  useEffect(() => {
    if (!selectedPaste) return;
    setDirty(true);
  }, [title, content, isPublic, selectedPaste]);

  const copyLink = (slug) => {
    const link = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(link);
  };

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    setAvatarUploading(true);
    try {
      const res = await profileAPI.updatePhoto(formData);
      updateUser(res.data.data.user);
    } catch (err) {
      console.error('Failed to upload avatar', err);
    } finally {
      setAvatarUploading(false);
    }
  };

  const onNameChange = async () => {
    const newName = prompt('Update display name', user.name);
    if (!newName) return;
    try {
      const res = await profileAPI.updateName({ name: newName });
      updateUser(res.data.data.user);
    } catch (err) {
      console.error('Failed to update name', err);
    }
  };

  return (
    <div className="dashboard">
      <header className="topbar">
        <div className="brand" onClick={() => window.location.href = '/'} style={{cursor: 'pointer'}}>
           Pastebin Mini <span style={{fontSize: '0.6em', opacity: 0.7}}>// Feature</span>
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
              <button className="link" onClick={() => fileInputRef.current?.click()}>Upload avatar</button>
              <button className="link" onClick={onNameChange}>Edit name</button>
              <button className="link" onClick={logout}>Logout</button>
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onAvatarChange}
            style={{ display: 'none' }}
            accept="image/*"
          />
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
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    <span>{isPublic ? 'Public' : 'Private'}</span>
                  </label>
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
      {avatarUploading && <div className="toast">Uploading avatar...</div>}
    </div>
  );
};

export default Dashboard;
