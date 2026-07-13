import { useState } from 'react';
import { MessageSquare, Mail, Lock, Loader2, User, ArrowRight } from 'lucide-react';
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
      await axiosInstance.post('/auth/register', formData);
      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 relative overflow-hidden">
      {/* Background Animated Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-white/20 blur-3xl rounded-full mix-blend-overlay animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[30rem] h-[30rem] bg-indigo-500/40 blur-3xl rounded-full mix-blend-overlay animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="card w-full max-w-lg bg-base-100/80 backdrop-blur-xl shadow-2xl z-10 border border-white/10 animate-fade-in-up transition-all duration-300 hover:shadow-purple-500/20 my-8">
        <div className="card-body p-8 sm:p-12">
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="bg-gradient-to-tr from-primary to-secondary p-4 rounded-3xl mb-6 text-primary-content shadow-lg shadow-primary/30 transform hover:scale-110 transition-transform duration-300">
              <MessageSquare size={36} strokeWidth={2.5} />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">Create Account</h2>
            <p className="text-white/80 mt-2 text-sm font-medium">Sign up to get started with messaging</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="alert alert-error shadow-sm text-sm p-3 rounded-xl animate-shake">
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="alert alert-success shadow-sm text-sm p-3 rounded-xl animate-fade-in-up">
                <span>{success}</span>
              </div>
            )}

            <div className="form-control group">
              <label className="label pb-1"><span className="label-text font-semibold text-white/90 group-focus-within:text-white transition-colors">Full Name</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-white transition-colors">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="input input-bordered w-full pl-11 bg-base-300/40 text-white placeholder:text-white/40 focus:bg-base-300/60 focus:ring-2 ring-white/50 border-white/20 transition-all rounded-xl"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-control group">
              <label className="label pb-1"><span className="label-text font-semibold text-white/90 group-focus-within:text-white transition-colors">Email Address</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-white transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="input input-bordered w-full pl-11 bg-base-300/40 text-white placeholder:text-white/40 focus:bg-base-300/60 focus:ring-2 ring-white/50 border-white/20 transition-all rounded-xl"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-control group">
              <label className="label pb-1"><span className="label-text font-semibold text-white/90 group-focus-within:text-white transition-colors">Password</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-white transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full pl-11 bg-base-300/40 text-white placeholder:text-white/40 focus:bg-base-300/60 focus:ring-2 ring-white/50 border-white/20 transition-all rounded-xl"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn w-full mt-4 rounded-xl hover:-translate-y-1 shadow-xl shadow-pink-500/30 transition-all duration-300 font-bold text-lg border-none bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white" 
              disabled={isLoading || !!success}
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign Up <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>

          <div className="divider mt-6 text-base-content/40 text-sm">Already a member?</div>

          <div className="text-center mt-2">
            <Link to="/login" className="btn btn-outline btn-block rounded-xl border-base-content/20 hover:border-primary hover:bg-primary/5 transition-all">
              Sign in to your account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
