import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import SearchUsers from './pages/SearchUsers';
import PublicProfile from './pages/PublicProfile';
import ProjectEditor from './pages/ProjectEditor';
import ExploreProjects from './pages/ExploreProjects';
import JoinCollab from './pages/JoinCollab';
import AdminManageUsers from './pages/AdminManageUsers';
import AdminActiveSessions from './pages/AdminActiveSessions';
import AdminActiveJobs from './pages/AdminActiveJobs';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminManageLanguages from './pages/AdminManageLanguages';
import AdminBroadcasts from './pages/AdminBroadcasts';
import AdminLayout from './components/AdminLayout';

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Admin Route Wrapper (locks down admin routes to role === 'Admin')
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== 'Admin') {
    return <Navigate to="/dashboard" replace />;
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

        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="analytics" replace />} />
          <Route path="users" element={<AdminManageUsers />} />
          <Route path="sessions" element={<AdminActiveSessions />} />
          <Route path="jobs" element={<AdminActiveJobs />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="languages" element={<AdminManageLanguages />} />
          <Route path="broadcasts" element={<AdminBroadcasts />} />
        </Route>

        {/* Public Routes for UC3 & UC5 */}
        <Route path="/search" element={<SearchUsers />} />
        <Route path="/explore" element={<ExploreProjects />} />
        <Route path="/u/:username" element={<PublicProfile />} />
        
        {/* Project IDE Route */}
        <Route path="/p/:projectId" element={<ProjectEditor />} />

        {/* Collaboration Session Join Route */}
        <Route path="/collab/:sessionId" element={<JoinCollab />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <SocketProvider>
          <Toaster position="top-right" toastOptions={{
            style: {
              background: '#1a1d24',
              color: '#f8f9fa',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#1a1d24' }
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#1a1d24' }
            }
          }} />
          <AppContent />
        </SocketProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;
