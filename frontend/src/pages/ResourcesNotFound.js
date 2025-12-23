import React from 'react';
import { Link } from 'react-router-dom';
import './ResourcesNotFound.css';

const ResourcesNotFound = () => {
  React.useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  return (
    <div className="full-center">
      <div style={{ textAlign: 'center' }}>
        <h2>Resource not found</h2>
        <p className="muted">The item you are looking for does not exist.</p>
        <Link to="/" className="resources-home-button">Back to home</Link>
      </div>
    </div>
  );
};

export default ResourcesNotFound;
