import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { useChatStore } from './store/useChatStore';
import { Loader2 } from 'lucide-react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import { useThemeStore } from './store/useThemeStore';
import './index.css';

function App() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { initSocket, disconnectSocket } = useChatStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (authUser) {
      initSocket();
    } else {
      disconnectSocket();
    }
  }, [authUser, initSocket, disconnectSocket]);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 bg-base-100">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
          <Loader2 className="animate-spin text-primary relative z-10" size={56} strokeWidth={2} />
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={authUser ? <ChatPage /> : <Navigate to="/login" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/register" element={!authUser ? <RegisterPage /> : <Navigate to="/" />} />
          <Route path="/settings" element={authUser ? <SettingsPage /> : <Navigate to="/login" />} />
          <Route path="/change-password" element={authUser ? <ChangePasswordPage /> : <Navigate to="/login" />} />
          <Route path="/verify-email/:token" element={<VerifyEmailPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
