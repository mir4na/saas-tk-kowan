import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { pasteAPI } from '../services/api';
import './Paste.css';

const Paste = () => {
  const { slug } = useParams();
  const [paste, setPaste] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await pasteAPI.get(slug);
        setPaste(res.data.data);
      } catch (err) {
        setError('Paste not found or private.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [slug]);

  if (loading) return <div className="full-center"><div className="spinner" /></div>;
  if (error) return <div className="full-center"><p>{error}</p></div>;

  return (
    <div className="paste-page">
      <header className="paste-header">
        <div>
          <p className="eyebrow">Pastebin Mini</p>
          <h1>{paste.title}</h1>
          <div className="muted small">/{paste.slug}</div>
        </div>
        <div className="pill">{paste.is_public ? 'Public' : 'Private'}</div>
      </header>
      <article className="paste-content">
        <pre>{paste.content || 'No content'}</pre>
      </article>
      <footer className="paste-footer">
        <Link to="/">Back to home</Link>
      </footer>
    </div>
  );
};

export default Paste;
