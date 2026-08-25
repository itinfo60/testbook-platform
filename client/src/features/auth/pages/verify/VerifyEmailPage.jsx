import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { authAPI } from '@/services/api';
import { loginWithSupabase } from '@/features/auth/authSlice';
import supabase from '@/services/supabase';
import { HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import { Button } from '@/components/ui';
import toast from 'react-hot-toast';

export default function VerifyEmailPage() {
  const { token } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const handleResend = async () => {
    if (!resendEmail || !resendEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (resendCooldown > 0 || resendLoading) return;

    setResendLoading(true);
    try {
      await supabase.auth.resend({
        type: 'signup',
        email: resendEmail.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      await authAPI.resendVerification(resendEmail.trim()).catch(() => {});
      toast.success('Verification email resent! Please check your inbox.');
      setResendCooldown(60);
      const interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      toast.error(err.message || 'Failed to resend verification email');
    } finally {
      setResendLoading(false);
    }
  };

  useEffect(() => {
    const verify = async () => {
      // 1. Check Supabase session first (email confirmation link often lands with session)
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          await dispatch(loginWithSupabase({ accessToken: session.access_token }));
          setStatus('success');
          setMessage('Your email has been verified successfully!');
          return;
        }
      } catch (err) {
        console.warn('Supabase verification check:', err);
      }

      // 2. If token param exists, verify against backend
      if (token) {
        try {
          const res = await authAPI.verifyEmail(token);
          setStatus('success');
          setMessage(res.data?.message || 'Email verified successfully!');
          return;
        } catch (err) {
          setStatus('error');
          setMessage(err.response?.data?.message || 'Verification link is invalid or has expired.');
          return;
        }
      }

      setStatus('error');
      setMessage('Invalid or missing verification link.');
    };

    verify();
  }, [token, dispatch]);

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
            <p className="text-dark-500 mb-6">{message}</p>

            <div className="space-y-4 mb-6">
              <input
                type="email"
                value={resendEmail}
                onChange={(e) => setResendEmail(e.target.value)}
                placeholder="Enter your registered email"
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleResend}
                loading={resendLoading}
                disabled={resendCooldown > 0 || resendLoading}
                className="w-full !py-2.5 text-sm font-medium"
              >
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Email'}
              </Button>
            </div>

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
