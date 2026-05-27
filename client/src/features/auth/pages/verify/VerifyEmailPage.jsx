import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '@/services/api';
import { HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import { Button } from '@/components/ui';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid or missing verification token.');
      return;
    }

    const verify = async () => {
      try {
        const res = await authAPI.verifyEmail(token);
        setStatus('success');
        setMessage(res.data?.message || 'Email verified successfully!');
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may be expired.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="card p-8 max-w-md w-full text-center animate-fade-in">
        {status === 'loading' && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-6"></div>
            <h2 className="text-xl font-bold text-dark-900 dark:text-white mb-2">
              Verifying Email...
            </h2>
            <p className="text-dark-500">Please wait while we verify your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <HiCheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">
              Email Verified!
            </h2>
            <p className="text-dark-500 mb-8">{message}</p>
            <Button onClick={() => navigate('/dashboard')} variant="primary" className="w-full">
              Continue to Dashboard
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <HiExclamationCircle className="h-20 w-20 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">
              Verification Failed
            </h2>
            <p className="text-dark-500 mb-8">{message}</p>
            <Link to="/login">
              <Button variant="primary" className="w-full">
                Go to Login
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
