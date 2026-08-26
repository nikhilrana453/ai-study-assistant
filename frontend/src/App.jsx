import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login          from './pages/Login';
import Register       from './pages/Register';
import Dashboard      from './pages/Dashboard';
import Chat           from './pages/Chat';
import AdminDashboard from './pages/AdminDashboard';
import UploadMaterial from './pages/UploadMaterial';
import Bookmarks      from './pages/Bookmarks';
import Quiz           from './pages/Quiz';
import Flashcards     from './pages/Flashcards';
import Analytics from './pages/Analytics';
import { ThemeProvider } from './context/ThemeContext';

function HomeRedirect() {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"        element={<HomeRedirect />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/chat/:courseId" element={
            <ProtectedRoute><Chat /></ProtectedRoute>
          } />
          <Route path="/bookmarks" element={
            <ProtectedRoute><Bookmarks /></ProtectedRoute>
          } />
          <Route path="/quiz/:courseId" element={
            <ProtectedRoute><Quiz /></ProtectedRoute>
          } />
          <Route path="/flashcards/:courseId" element={
            <ProtectedRoute><Flashcards /></ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/admin/upload" element={
            <ProtectedRoute adminOnly><UploadMaterial /></ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute adminOnly><UploadMaterial /></ProtectedRoute>
          } />

         
          <Route path="/admin/analytics" element={
            <ProtectedRoute adminOnly><Analytics /></ProtectedRoute>
          } />

          <Route path="*" element={<HomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}