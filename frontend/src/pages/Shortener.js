import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import './Shortener.css';

function Shortener() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setShortUrl('');

    try {
      const response = await api.post('/urls', { originalUrl });
      console.log('Shortener response:', response.data);
      const { short_code } = response.data.data;
      
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      
      const generatedUrl = `${protocol}//${hostname}${port}/u/${short_code}`;
      setShortUrl(generatedUrl);
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
    <div className="shortener-container full-center fadeIn">
      <div className="glass-card">
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
        
        <button className="text-button" onClick={() => navigate('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}

export default Shortener;
