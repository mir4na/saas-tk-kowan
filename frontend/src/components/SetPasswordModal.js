import React, { useState } from 'react';
import Modal from './Modal';

const SetPasswordModal = ({ isOpen, onClose, onSet, hasPassword }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password.trim()) {
      onSet(password);
      setPassword('');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{
          fontSize: '1.5rem',
          marginBottom: '16px',
          color: 'var(--primary-cyan)'
        }}>
          {hasPassword ? 'Change Password' : 'Set Password'}
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '24px' }}>
          {hasPassword 
            ? 'Enter a new password to update the protection for this paste.'
            : 'Private pastes require a password. Please set one below.'
          }
        </p>
        <form onSubmit={handleSubmit}>
          {hasPassword && (
            <div style={{ textAlign: 'left', marginBottom: '16px' }}>
              <label style={{ display: 'block', color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', marginBottom: '4px' }}>
                Previous Password
              </label>
              <input
                type="password"
                value="********"
                disabled
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: '1rem',
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'not-allowed'
                }}
              />
            </div>
          )}
          
          <div style={{ textAlign: 'left', marginBottom: '20px' }}>
            {hasPassword && (
               <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '4px' }}>
                 New Password
               </label>
            )}
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={hasPassword ? "Enter new password" : "Enter password"}
              autoFocus
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '1rem',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(0, 217, 255, 0.3)',
                borderRadius: '8px',
                color: 'white',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 24px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!password.trim()}
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, var(--primary-cyan), var(--primary-purple))',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                opacity: !password.trim() ? 0.5 : 1
              }}
            >
              {hasPassword ? 'Update Password' : 'Set Password'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default SetPasswordModal;
