import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import { useAuth } from '../contexts/AuthContext';
import { profileAPI } from '../services/api';
import Modal from '../components/Modal';
import getCroppedImg from '../utils/cropImage';
import './Profile.css';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [description, setDescription] = useState(user?.description || '');
  const [previewPhoto, setPreviewPhoto] = useState(user?.profilePhoto || '');
  
  // Crop state
  const [photoFile, setPhotoFile] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const fileInputRef = useRef(null);

  const isOwnProfile = useMemo(() => {
    if (!id) return true;
    if (!user?.id) return false;
    return String(id) === String(user.id);
  }, [id, user]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    if (!isOwnProfile) return;
    setDisplayName(user?.name || '');
    setDescription(user?.description || '');
    setPreviewPhoto(user?.profilePhoto || '');
  }, [isOwnProfile, user]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPhoto(reader.result);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    try {
      setUploadingPhoto(true);
      const croppedBlob = await getCroppedImg(previewPhoto, croppedAreaPixels);
      const file = new File([croppedBlob], "profile_cropped.jpg", { type: "image/jpeg" });
      
      const formData = new FormData();
      formData.append('photo', file);
      const photoRes = await profileAPI.updatePhoto(formData);
      updateUser(photoRes.data.data.user);
      
      // Update local preview with the cropped version (base64 of blob)
      const reader = new FileReader();
      reader.onloadend = () => setPreviewPhoto(reader.result);
      reader.readAsDataURL(croppedBlob);
      
      setIsCropping(false);
      setPhotoFile(null);
    } catch (err) {
      console.error('Failed to update profile photo', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCancelCrop = () => {
    setIsCropping(false);
    setPhotoFile(null);
    setPreviewPhoto(user?.profilePhoto || ''); // Revert
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setSaving(true);
    setSaved(false);
    try {
      if (displayName.trim() !== user?.name || description !== user?.description) {
        const payload = { 
          name: displayName.trim(),
          description: description
        };
        const res = await profileAPI.updateName(payload);
        updateUser(res.data.data.user);
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
                if (isOwnProfile) fileInputRef.current?.click();
              }}
              role={isOwnProfile ? 'button' : undefined}
              tabIndex={isOwnProfile ? 0 : undefined}
            >
              {previewPhoto || displayUser?.profilePhoto ? (
                <img src={previewPhoto || displayUser.profilePhoto} alt="profile avatar" />
              ) : (
                <span>{displayUser?.name?.[0] || '?'}</span>
              )}
              {isOwnProfile && <div className="profile-avatar-overlay">Change</div>}
            </div>
            {isOwnProfile && (
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoSelect}
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
              <div className="form-group">
                <label className="profile-label">Display Name</label>
                <input
                  className="profile-input"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="profile-label">Email</label>
                <input
                  className="profile-input"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="profile-label">
                  Description <span style={{ fontSize: '0.8em', opacity: 0.6 }}>({description.length}/60)</span>
                </label>
                <textarea
                  className="profile-input"
                  value={description}
                  onChange={(e) => {
                    if (e.target.value.length <= 60) setDescription(e.target.value);
                  }}
                  placeholder="Short bio (max 60 chars)"
                  rows={2}
                  style={{ resize: 'none' }}
                />
              </div>

              <button
                className={`profile-save-button ${saved ? 'saved' : ''}`}
                type="submit"
                disabled={saving}
              >
                {saved ? 'Saved' : 'Save Changes'}
              </button>
            </form>
          ) : (
             <div className="profile-readonly">
               {/* Read-only view for others could go here if implemented */}
               <p>This profile is view-only.</p>
             </div>
          )}
        </div>
      </main>

      {/* Crop Modal */}
      <Modal isOpen={isCropping} onClose={handleCancelCrop}>
        <div style={{ width: '100%', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
          <h3>Adjust Photo</h3>
          <div style={{ position: 'relative', height: '300px', margin: '20px 0', background: '#333' }}>
            <Cropper
              image={previewPhoto}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="modal-actions" style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={handleCancelCrop} className="ghost" style={{ border: '1px solid currentColor', padding: '8px 16px', borderRadius: '8px' }}>
              Cancel
            </button>
            <button 
              onClick={handleCropSave} 
              disabled={uploadingPhoto}
              style={{
                background: 'var(--primary-cyan)', 
                color: '#000', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: uploadingPhoto ? 'wait' : 'pointer'
              }}
            >
              {uploadingPhoto ? 'Uploading...' : 'Apply & Save'}
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

export default Profile;
