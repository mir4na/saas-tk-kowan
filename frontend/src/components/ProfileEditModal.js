import React, { useState, useRef } from 'react';
import Modal from './Modal';

const ProfileEditModal = ({ isOpen, onClose, user, onSave, uploading }) => {
  const [name, setName] = useState(user?.name || '');
  const [previewPhoto, setPreviewPhoto] = useState(user?.profilePhoto || '');
  const [photoFile, setPhotoFile] = useState(null);
  const fileInputRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, photoFile });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{
          fontSize: '1.8rem',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, var(--primary-cyan), var(--primary-purple))',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          ✏️ Edit Profile
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '30px' }}>
          Update your profile photo and display name
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '30px' }}>
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                margin: '0 auto 16px',
                background: previewPhoto
                  ? `url(${previewPhoto}) center/cover`
                  : 'linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(181, 55, 242, 0.2))',
                border: '3px solid var(--primary-cyan)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '3rem',
                color: 'white',
                transition: 'all 0.3s',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 217, 255, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {!previewPhoto && (user?.name?.[0] || '?')}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '8px',
                fontSize: '0.7rem',
                opacity: 0,
                transition: 'opacity 0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              >
                Change
              </div>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
              accept="image/*"
            />
            <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>
              Click to upload new photo
            </p>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              textAlign: 'left',
              marginBottom: '8px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '0.9rem',
              fontWeight: '500'
            }}>
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(0, 217, 255, 0.3)',
                borderRadius: '12px',
                color: 'white',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--primary-cyan)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(0, 217, 255, 0.3)'}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              style={{
                padding: '12px 30px',
                fontSize: '1rem',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: uploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                opacity: uploading ? 0.5 : 1
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              style={{
                padding: '12px 30px',
                fontSize: '1rem',
                background: uploading
                  ? 'rgba(100, 100, 100, 0.5)'
                  : 'linear-gradient(135deg, var(--primary-cyan), var(--primary-purple))',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s',
                boxShadow: uploading ? 'none' : '0 4px 15px rgba(0, 217, 255, 0.3)'
              }}
            >
              {uploading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ProfileEditModal;
