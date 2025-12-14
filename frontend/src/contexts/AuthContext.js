import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { authAPI } from '../services/api';
import { registerWithPasskey, loginWithPasskey } from '../utils/webauthn';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [API_URL, logout]);

  const login = useCallback(async (email) => {
    const response = await loginWithPasskey(
      email,
      authAPI.loginOptions,
      authAPI.loginVerify
    );

    const { token, user } = response.data;

    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setToken(token);
    setUser(user);

    return response;
  }, []);

  const register = useCallback(async (name, email) => {
    const response = await registerWithPasskey(
      email,
      name,
      authAPI.registerOptions,
      authAPI.registerVerify
    );

    const { token, user } = response.data;

    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    setToken(token);
    setUser(user);

    return response;
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user
  }), [user, loading, login, register, logout, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
