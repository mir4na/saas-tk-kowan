import React, { useState } from 'react';
import api from '../services/api';
import './ShortenerModal.css';

const ShortenerModal = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/urls', { originalUrl });
      const { short_code } = response.data.data;
      
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      
      setShortUrl(`${protocol}//${hostname}${port}/u/${short_code}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to shorten URL');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shortUrl);
    alert('Copied to clipboard!');
  };

  return (
    <div className="shortener-modal-content">
      <h2 className="gradient-text">URL Shortener</h2>
      <form onSubmit={handleSubmit} className="shortener-form">
        <input
          type="url"
          className="futuristic-input"
          placeholder="Enter long URL here..."
          value={originalUrl}
          onChange={(e) => setOriginalUrl(e.target.value)}
          required
        />
        <button type="submit" className="neon-button" disabled={loading}>
          {loading ? 'Shortening...' : 'Shorten'}
        </button>
      </form>

      {error && <p className="error-text">{error}</p>}

      {shortUrl && (
        <div className="result-container fadeIn">
          <p>Your shortened link:</p>
          <div className="short-url-box">
            <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="short-link">
              {shortUrl}
            </a>
            <button onClick={copyToClipboard} className="icon-button">
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShortenerModal;
