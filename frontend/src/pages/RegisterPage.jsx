import { useState } from 'react';
import { MessageSquare, Mail, Lock, Loader2, User } from 'lucide-react';
import { axiosInstance } from '../lib/axios';
import { Link, useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    setIsLoading(true);
    try {
      await axiosInstance.post('/auth/api/register', formData);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
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
            <h2 className="card-title text-2xl font-bold">Create account</h2>
            <p className="text-base-content/60 mt-2">Sign up to get started with messaging</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="alert alert-error shadow-sm text-sm p-3">
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="alert alert-success shadow-sm text-sm p-3">
                <span>{success}</span>
              </div>
            )}

            <div className="form-control">
              <label className="label"><span className="label-text">Full Name</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-base-content/50">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="input input-bordered w-full pl-10"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

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
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign Up'}
            </button>
          </form>

          <div className="text-center mt-6 text-sm text-base-content/70">
            Already have an account?{' '}
            <Link to="/login" className="link link-primary font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
