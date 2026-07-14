import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Save } from 'lucide-react';

const ChangePasswordPage = () => {
  const { changePassword } = useAuthStore();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }

    setIsSubmitting(true);
    const res = await changePassword(currentPassword, newPassword);
    setIsSubmitting(false);

    if (res.success) {
      // Show success and redirect back to settings
      navigate('/settings');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-base-200">
      <div className="navbar bg-base-100 shadow-sm px-4 sticky top-0 z-20">
        <Link to="/settings" className="btn btn-ghost btn-circle">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold ml-2">Change Password</h1>
      </div>

      <div className="flex-1 flex justify-center items-center p-4">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4 flex items-center gap-2">
              <Lock className="text-primary" /> Security
            </h2>
            
            {error && (
              <div className="alert alert-error py-2 shadow-sm mb-4">
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label"><span className="label-text">Current Password</span></label>
                <input 
                  type="password" 
                  className="input input-bordered w-full focus:input-primary transition-colors" 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  required 
                />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">New Password</span></label>
                <input 
                  type="password" 
                  className="input input-bordered w-full focus:input-primary transition-colors" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                  minLength={6}
                />
              </div>

              <div className="form-control">
                <label className="label"><span className="label-text">Confirm New Password</span></label>
                <input 
                  type="password" 
                  className="input input-bordered w-full focus:input-primary transition-colors" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  required 
                  minLength={6}
                />
              </div>

              <div className="card-actions justify-end mt-6">
                <Link to="/settings" className="btn btn-ghost">Cancel</Link>
                <button type="submit" className="btn btn-primary shadow-sm" disabled={isSubmitting}>
                  <Save size={18} className="mr-2" /> 
                  {isSubmitting ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
