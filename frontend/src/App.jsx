import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Loader2 } from 'lucide-react';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import './index.css';

function App() {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-100">
        <Loader2 className="animate-spin text-primary" size={48} />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-container" data-theme={localStorage.getItem('theme') || 'dark'}>
        <Routes>
          <Route path="/" element={authUser ? <ChatPage /> : <Navigate to="/login" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/register" element={!authUser ? <RegisterPage /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
