import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
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
import Footer from './components/Footer';

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
  const location = useLocation();
  const isFullPageRoom = location.pathname.startsWith('/p/') || location.pathname.startsWith('/collab/');

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
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

          <Route path="/forgot-password" element={
            <GuestRoute>
              <ForgotPassword />
            </GuestRoute>
          } />

          <Route path="/reset-password/:resetToken" element={
            <GuestRoute>
              <ResetPassword />
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
          <Route path="/search" element={
            <ProtectedRoute>
              <SearchUsers />
            </ProtectedRoute>
          } />
          <Route path="/explore" element={<ExploreProjects />} />
          <Route path="/u/:username" element={<PublicProfile />} />
          
          {/* Project IDE Route */}
          <Route path="/p/:projectId" element={<ProjectEditor />} />

          {/* Collaboration Session Join Route */}
          <Route path="/collab/:sessionId" element={<JoinCollab />} />
        </Routes>
      </main>
      {!isFullPageRoom && <Footer />}
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <SocketProvider>
            <ToastContainer 
              position="bottom-center"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
            />
            <AppContent />
          </SocketProvider>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
