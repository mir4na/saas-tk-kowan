import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profileAPI } from '../services/api';
import Modal from '../components/Modal';
import './Profile.css';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [previewPhoto, setPreviewPhoto] = useState(user?.profilePhoto || '');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const fileInputRef = useRef(null);

  const isOwnProfile = useMemo(() => {
    if (!id) return true;
    if (!user?.id) return false;
    return String(id) === String(user.id);
  }, [id, user]);

  useEffect(() => {
    if (!isOwnProfile) {
      return;
    }
    setDisplayName(user?.name || '');
    setPreviewPhoto(user?.profilePhoto || '');
  }, [isOwnProfile, user]);

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewPhoto(reader.result);
    };
    reader.readAsDataURL(file);
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const photoRes = await profileAPI.updatePhoto(formData);
      updateUser(photoRes.data.data.user);
    } catch (err) {
      console.error('Failed to update profile photo', err);
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) {
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      if (displayName.trim() !== user?.name) {
        const nameRes = await profileAPI.updateName({ name: displayName.trim() });
        updateUser(nameRes.data.data.user);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setSaving(false);
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

  const displayUser = isOwnProfile ? user : null;

  return (
    <div className="profile-page">
      <header className="profile-topbar">
        <div className="brand-logo">⚡ QUICKCLIP</div>
        <nav className="nav-links">
          <Link to="/" className="app-nav-link">Home</Link>
          <button onClick={() => setShowFeatureModal(true)} className="app-nav-link">Features</button>
          <Link to="/profile" className="app-nav-link">Profile</Link>
          <button onClick={logout} className="app-nav-link logout-link">Logout</button>
        </nav>
      </header>

      <main className="profile-content">
        <div className="profile-card">
          <div className="profile-header">
            <div
              className={`profile-avatar ${isOwnProfile ? 'profile-avatar-editable' : ''}`}
              onClick={() => {
                if (isOwnProfile) {
                  fileInputRef.current?.click();
                }
              }}
              role={isOwnProfile ? 'button' : undefined}
              tabIndex={isOwnProfile ? 0 : undefined}
              onKeyDown={(e) => {
                if (isOwnProfile && (e.key === 'Enter' || e.key === ' ')) {
                  fileInputRef.current?.click();
                }
              }}
            >
              {previewPhoto || displayUser?.profilePhoto ? (
                <img src={previewPhoto || displayUser.profilePhoto} alt="profile avatar" />
              ) : (
                <span>{displayUser?.name?.[0] || '?'}</span>
              )}
              {photoUploading && (
                <div className="profile-avatar-overlay">
                  <span className="profile-spinner" />
                </div>
              )}
            </div>
            {isOwnProfile && (
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
                accept="image/*"
              />
            )}
            <div className="profile-meta">
              <h2>{isOwnProfile ? 'Your Profile' : 'Profile'}</h2>
              <p className="profile-subtitle">
                {isOwnProfile ? 'Manage your profile details.' : `Profile ID: ${id || ''}`}
              </p>
            </div>
          </div>

          {isOwnProfile ? (
            <form className="profile-form" onSubmit={handleProfileSave}>
              <label className="profile-label" htmlFor="profile-display-name">
                Display name
              </label>
              <input
                id="profile-display-name"
                className="profile-input"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your display name"
                required
              />
              <button
                className={`profile-save-button ${saved ? 'saved' : ''}`}
                type="submit"
                disabled={saving}
              >
                {saved ? 'Saved' : 'Save'}
              </button>
            </form>
          ) : (
            <div className="profile-readonly">
              <p>This profile is view-only.</p>
            </div>
          )}
        </div>
      </main>

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

export default Profile;
