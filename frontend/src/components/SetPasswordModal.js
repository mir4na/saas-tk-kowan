import React, { useState } from 'react';
import Modal from './Modal';

const SetPasswordModal = ({ isOpen, onClose, onSet }) => {
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
          Set Password
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '24px' }}>
          Private pastes require a password. Please set one below.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            style={{
              width: '100%',
              padding: '12px 16px',
              fontSize: '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              borderRadius: '8px',
              color: 'white',
              marginBottom: '20px',
              outline: 'none'
            }}
          />
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
              Set Password
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default SetPasswordModal;
