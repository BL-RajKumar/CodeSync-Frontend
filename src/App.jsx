import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import SearchUsers from './pages/SearchUsers';
import PublicProfile from './pages/PublicProfile';
import ProjectEditor from './pages/ProjectEditor';
import ExploreProjects from './pages/ExploreProjects';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Guest Route Wrapper (redirects to dashboard if already logged in)
const GuestRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

const AppContent = () => {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        <Route path="/login" element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        } />
        
        <Route path="/register" element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        } />
        
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        {/* Public Routes for UC3 & UC5 */}
        <Route path="/search" element={<SearchUsers />} />
        <Route path="/explore" element={<ExploreProjects />} />
        <Route path="/u/:username" element={<PublicProfile />} />
        
        {/* Project IDE Route */}
        <Route path="/p/:projectId" element={
          <ProtectedRoute>
            <ProjectEditor />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border-color)',
            backdropFilter: 'var(--glass-blur)'
          }
        }} />
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
