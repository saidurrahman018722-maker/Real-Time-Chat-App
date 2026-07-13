import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { MessageSquare, Mail, Lock, Loader2 } from 'lucide-react';
import { axiosInstance } from '../lib/axios';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (isLogin) {
      const res = await login(formData.email, formData.password);
      if (!res.success) setError(res.message);
    } else {
      setIsLoading(true);
      try {
        await axiosInstance.post('/auth/api/register', formData);
        setError('Registration successful! Please verify your email.');
        setTimeout(() => setIsLogin(true), 3000);
      } catch (err) {
        setError(err.response?.data?.message || 'Registration failed');
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-full max-w-md bg-base-100 shadow-xl animate-slide-up">
        <div className="card-body">
          <div className="flex flex-col items-center mb-6">
            <div className="bg-primary/10 p-3 rounded-2xl mb-4 text-primary">
              <MessageSquare size={32} />
            </div>
            <h2 className="card-title text-2xl font-bold">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-base-content/60 mt-2">
              {isLogin ? 'Sign in to your account to continue' : 'Sign up to get started with messaging'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className={`alert ${error.includes('successful') ? 'alert-success' : 'alert-error'} shadow-sm`}>
                <span>{error}</span>
              </div>
            )}

            {!isLogin && (
              <div className="form-control">
                <label className="label"><span className="label-text">Full Name</span></label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="input input-bordered w-full"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="form-control">
              <label className="label"><span className="label-text">Email</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="input input-bordered w-full pl-10"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text">Password</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full pl-10"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary mt-4" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? 'Sign In' : 'Sign Up')}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-base-content/70">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button className="link link-primary font-medium" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
