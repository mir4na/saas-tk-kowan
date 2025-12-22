import React, { memo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Paste from './pages/Paste';
import Choice from './pages/Choice';
import Shortener from './pages/Shortener';

import './App.css';

const ProtectedRoute = memo(({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="full-center">
        <div className="spinner" />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
});

const PublicRoute = memo(({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="full-center">
        <div className="spinner" />
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/" />;
});

function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <div className="App">
            <Routes>
              <Route path="/" element={<Landing />} />

              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />

              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Choice />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/pastebin"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/shortener"
                element={
                  <ProtectedRoute>
                    <Shortener />
                  </ProtectedRoute>
                }
              />

              <Route path="/p/:slug" element={<Paste />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
