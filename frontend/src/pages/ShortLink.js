import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import api from '../services/api';

const ShortLink = () => {
  const { code } = useParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    let isActive = true;

    const resolve = async () => {
      try {
        const response = await api.get(`/urls/resolve/${code}`);
        const target = response.data?.data?.original_url;
        if (target) {
          window.location.replace(target);
          return;
        }
        if (isActive) {
          setError(true);
        }
      } catch (err) {
        if (isActive) {
          setError(true);
        }
      }
    };

    resolve();

    return () => {
      isActive = false;
    };
  }, [code]);

  if (error) {
    return <Navigate to="/resources-not-found" replace />;
  }

  return (
    <div className="full-center">
      <div className="spinner" />
    </div>
  );
};

export default ShortLink;
