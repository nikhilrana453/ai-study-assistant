import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Bookmarks from './pages/Bookmarks';
import Quiz from './pages/Quiz';
import Flashcards from './pages/Flashcards';
import AdminDashboard from './pages/AdminDashboard';
import UploadMaterial from './pages/UploadMaterial';
import Analytics from './pages/Analytics';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import SearchChats from './pages/SearchChats';
import Summariser from './pages/Summariser';
import './App.css';

// Redirect based on user role
function HomeRedirect() {
  const { user, token } = useAuth();

  if (!token) {
    return <Login />;
  }

  if (user?.role === 'ADMIN') {
    window.location.href = '/admin';
    return null;
  }

  window.location.href = '/dashboard';
  return null;
}

// Protected Route Component
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, token } = useAuth();

  if (!token) {
    window.location.href = '/login';
    return null;
  }

  if (adminOnly && user?.role !== 'ADMIN') {
    window.location.href = '/dashboard';
    return null;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Student Routes */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/chat/:courseId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
      <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
      <Route path="/quiz/:courseId" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
      <Route path="/flashcards/:courseId" element={<ProtectedRoute><Flashcards /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/search" element={<ProtectedRoute><SearchChats /></ProtectedRoute>} />
      <Route path="/summarise" element={<ProtectedRoute><Summariser /></ProtectedRoute>} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/upload" element={<ProtectedRoute adminOnly><UploadMaterial /></ProtectedRoute>} />
      <Route path="/admin/analytics" element={<ProtectedRoute adminOnly><Analytics /></ProtectedRoute>} />
      <Route path="/upload" element={<ProtectedRoute adminOnly><UploadMaterial /></ProtectedRoute>} />
      <Route path="/upload-materials" element={<ProtectedRoute adminOnly><UploadMaterial /></ProtectedRoute>} />
      <Route path="/analytics" element={<ProtectedRoute adminOnly><Analytics /></ProtectedRoute>} />

      {/* Catch all */}
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}