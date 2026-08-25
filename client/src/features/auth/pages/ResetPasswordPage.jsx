import { Input, Button } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiLockClosed, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import supabase from '@/services/supabase';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const { token } = useParams(); // legacy token-in-URL support
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState('');

  // On mount: consume the #access_token from the URL hash (Supabase recovery link)
  useEffect(() => {
    const establishSession = async () => {
      const hash = window.location.hash;

      if (hash && hash.includes('access_token=')) {
        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        if (type === 'recovery' && accessToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          if (error) {
            setSessionError('This reset link is invalid or has expired. Please request a new one.');
          } else {
            // Clean up hash from URL
            window.history.replaceState(null, '', window.location.pathname);
            setSessionReady(true);
          }
          return;
        }
      }

      // Fallback: maybe session already exists (page refresh)
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setSessionReady(true);
      } else if (!token) {
        // No hash, no session, no legacy token → invalid
        setSessionError('No valid reset session found. Please request a new password reset link.');
      } else {
        // Legacy token in URL param — backend-only flow
        setSessionReady(true);
      }
    };

    establishSession();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Update password via Supabase (session is already set via setSession above)
      const { error: sbError } = await supabase.auth.updateUser({
        password: formData.password,
      });

      if (sbError) {
        throw sbError;
      }

      toast.success('Password updated successfully!');
      // Sign out so user logs in fresh with new password
      await supabase.auth.signOut();
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      toast.error(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Invalid / expired link
  if (sessionError) {
    return (
      <div className="card p-6 sm:p-8 animate-fade-in max-w-md mx-auto text-center">
        <HiExclamationCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">Link Expired</h1>
        <p className="text-dark-500 mb-6">{sessionError}</p>
        <Button variant="primary" className="w-full" onClick={() => navigate('/forgot-password')}>
          Request New Reset Link
        </Button>
      </div>
    );
  }

  // Still establishing session from hash
  if (!sessionReady) {
    return (
      <div className="card p-6 sm:p-8 animate-fade-in max-w-md mx-auto text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
        <p className="text-dark-500">Validating reset link...</p>
      </div>
    );
  }

  return (
    <div className="card p-6 sm:p-8 animate-fade-in max-w-md mx-auto">
      <div className="text-center mb-6">
        <HiCheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Reset Password</h1>
        <p className="text-dark-500 mt-1">Enter your new password below</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New Password"
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Min 6 characters"
          icon={HiLockClosed}
          required
        />
        <Input
          label="Confirm Password"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          placeholder="Repeat password"
          icon={HiLockClosed}
          required
        />
        <Button type="submit" variant="primary" className="w-full !py-2.5" loading={loading}>
          Reset Password
        </Button>
      </form>
    </div>
  );
}
