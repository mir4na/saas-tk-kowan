import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { profileAPI } from '../services/api';
import Navbar from '../components/Navbar';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleNameSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await profileAPI.updateName({ name });
      updateUser(response.data.data.user);
      setSuccess('Name updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update name.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoSubmit = async (e) => {
    e.preventDefault();
    if (!photo) {
      setError('Please select a photo.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('photo', photo);

      const response = await profileAPI.updatePhoto(formData);
      updateUser(response.data.data.user);
      setSuccess('Photo updated successfully!');
      setPhoto(null);
      setPhotoPreview(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update photo.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoDelete = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await profileAPI.deletePhoto();
      updateUser(response.data.data.user);
      setSuccess('Photo deleted successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete photo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="profile-container">
        <div className="profile-header">
          <h1>Profile Settings</h1>
        </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="profile-content">
        <div className="profile-section">
          <h2>Profile Photo</h2>
          <div className="photo-section">
            <div className="current-photo">
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt="Profile" />
              ) : (
                <div className="no-photo">
                  <span>{user?.name?.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>

            {photoPreview && (
              <div className="photo-preview">
                <img src={photoPreview} alt="Preview" />
              </div>
            )}

            <form onSubmit={handlePhotoSubmit} className="photo-form">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                id="photo-input"
              />
              <label htmlFor="photo-input" className="btn-secondary">
                Choose Photo
              </label>
              {photo && (
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Uploading...' : 'Upload Photo'}
                </button>
              )}
            </form>

            {user?.profilePhoto && (
              <button
                onClick={handlePhotoDelete}
                className="btn-danger"
                disabled={loading}
              >
                Delete Photo
              </button>
            )}
          </div>
        </div>

        <div className="profile-section">
          <h2>Personal Information</h2>
          <form onSubmit={handleNameSubmit} className="name-form">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="disabled-input"
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Name'}
            </button>
          </form>
        </div>
      </div>
      </div>
    </>
  );
};

export default Profile;
