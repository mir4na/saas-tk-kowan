import React, { useState, useRef, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import Modal from './Modal';
import getCroppedImg from '../utils/cropImage';

const ProfileEditModal = ({ isOpen, onClose, user, onSave, uploading }) => {
  const [name, setName] = useState(user?.name || '');
  const [description, setDescription] = useState(user?.description || '');
  
  const [photoFile, setPhotoFile] = useState(null);
  const [previewPhoto, setPreviewPhoto] = useState(user?.profilePhoto || null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false);
  const fileInputRef = useRef(null);

  const handlePhotoChange = (e) => {
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
      const croppedBlob = await getCroppedImg(previewPhoto, croppedAreaPixels);
      const file = new File([croppedBlob], "profile_cropped.jpg", { type: "image/jpeg" });
      setPhotoFile(file);

      const reader = new FileReader();
      reader.onloadend = () => setPreviewPhoto(reader.result);
      reader.readAsDataURL(croppedBlob);
      
      setIsCropping(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelCrop = () => {
     setIsCropping(false);
     setPhotoFile(null);
     setPreviewPhoto(user?.profilePhoto || null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ name, description, photoFile });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={{ textAlign: 'center', width: '100%', maxWidth: '400px', margin: '0 auto' }}>
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

        {isCropping ? (
          <div style={{ position: 'relative', height: '300px', marginBottom: '20px', background: '#333' }}>
             <Cropper
              image={previewPhoto}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
             />
             <div style={{ position: 'absolute', bottom: -50, left: 0, right: 0, display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button 
                  onClick={handleCancelCrop} 
                  style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #fff', background: 'transparent', color: '#fff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCropSave}
                  style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary-cyan)', color: '#000', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Apply Crop
                </button>
             </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '30px' }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  background: previewPhoto
                    ? `url(${previewPhoto}) center/cover`
                    : 'linear-gradient(135deg, rgba(0, 217, 255, 0.2), rgba(181, 55, 242, 0.2))',
                  border: '2px solid var(--primary-cyan)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {!previewPhoto && (user?.name?.[0] || '?')}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handlePhotoChange}
                style={{ display: 'none' }}
                accept="image/*"
              />
              <p style={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                Tap avatar to change
              </p>
            </div>

            <div style={{ marginBottom: '20px', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>Display Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '30px', textAlign: 'left' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)' }}>
                Description <span style={{fontSize: '0.8em', opacity: 0.5}}>({description.length}/60)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => {
                  if (e.target.value.length <= 60) setDescription(e.target.value);
                }}
                placeholder="Short bio (max 60 chars)"
                rows={2}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '0.95rem',
                  outline: 'none',
                  resize: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  background: 'transparent',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(255,255,255,0.8)',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                style={{
                  padding: '12px 30px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--primary-cyan), var(--primary-purple))',
                  border: 'none',
                  color: 'white',
                  fontWeight: '600',
                  cursor: uploading ? 'not-allowed' : 'pointer'
                }}
              >
                {uploading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default ProfileEditModal;
