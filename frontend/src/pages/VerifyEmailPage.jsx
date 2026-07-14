import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

let isVerifying = false;

const VerifyEmailPage = () => {
  const { token } = useParams();
  const { verifyEmail } = useAuthStore();
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verify = async () => {
      if (isVerifying) return;
      isVerifying = true;
      
      const res = await verifyEmail(token);
      if (res.success) {
        setStatus('success');
        setMessage(res.message);
      } else {
        setStatus('error');
        setMessage(res.message);
      }
    };
    verify();
  }, [token, verifyEmail]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          {status === 'verifying' && (
            <>
              <Loader2 className="w-16 h-16 animate-spin text-primary mb-4" />
              <h2 className="card-title">Verifying...</h2>
              <p className="text-base-content/70">{message}</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <CheckCircle2 className="w-16 h-16 text-success mb-4" />
              <h2 className="card-title text-success">Verification Successful</h2>
              <p className="text-base-content/70">{message}</p>
              <div className="card-actions mt-6 w-full">
                <Link to="/settings" className="btn btn-primary w-full">Back to Settings</Link>
              </div>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-error mb-4" />
              <h2 className="card-title text-error">Verification Failed</h2>
              <p className="text-base-content/70">{message}</p>
              <div className="card-actions mt-6 w-full">
                <Link to="/settings" className="btn btn-outline w-full">Back to Settings</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
