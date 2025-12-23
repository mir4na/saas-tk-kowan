import React, { useState } from 'react';
import Modal from './Modal';

const PasswordModal = ({ isOpen, onClose, onSubmit, error }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(password);
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
          🔒 Password Required
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '30px' }}>
          This paste is password protected. Enter the password to view its content.
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
              padding: '14px 20px',
              fontSize: '1rem',
              background: 'rgba(0, 0, 0, 0.3)',
              border: '1px solid rgba(0, 217, 255, 0.3)',
              borderRadius: '12px',
              color: 'white',
              marginBottom: '20px',
              outline: 'none',
              transition: 'all 0.3s'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary-cyan)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(0, 217, 255, 0.3)'}
          />
          {error && (
            <p style={{ color: 'var(--primary-pink)', marginBottom: '16px', fontSize: '0.9rem' }}>
              {error}
            </p>
          )}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '12px 30px',
                fontSize: '1rem',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '12px',
                color: 'rgba(255, 255, 255, 0.7)',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 30px',
                fontSize: '1rem',
                background: 'linear-gradient(135deg, var(--primary-cyan), var(--primary-purple))',
                border: 'none',
                borderRadius: '12px',
                color: 'white',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(0, 217, 255, 0.3)'
              }}
            >
              Unlock
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default PasswordModal;
