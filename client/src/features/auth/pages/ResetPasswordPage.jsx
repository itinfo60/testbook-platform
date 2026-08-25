import { Input, Button } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HiLockClosed, HiExclamationCircle } from 'react-icons/hi';
import { authAPI } from '@/services/api';
import supabase from '@/services/supabase';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const { token } = useParams(); // backend token in URL
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [mode, setMode] = useState('backend'); // 'backend' | 'supabase'

  useEffect(() => {
    const init = async () => {
      const hash = window.location.hash;

      // Mode 1: Supabase recovery link with #access_token in URL hash
      if (hash && hash.includes('access_token=') && hash.includes('type=recovery')) {
        const params = new URLSearchParams(hash.replace(/^#/, ''));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          if (error) {
            setSessionError('This reset link is invalid or has expired. Please request a new one.');
          } else {
            window.history.replaceState(null, '', window.location.pathname);
            setMode('supabase');
            setSessionReady(true);
          }
          return;
        }
      }

      // Mode 2: Backend token in URL param (e.g. /reset-password/abc123)
      if (token && token !== 'undefined') {
        setMode('backend');
        setSessionReady(true);
        return;
      }

      setSessionError('No valid reset link found. Please request a new password reset.');
    };

    init();
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
      if (mode === 'supabase') {
        // Supabase session is already active — update password directly
        const { error } = await supabase.auth.updateUser({ password: formData.password });
        if (error) throw error;
        await supabase.auth.signOut();
      } else {
        // Backend token flow — call backend reset-password endpoint
        await authAPI.resetPassword(token, { password: formData.password });
      }

      toast.success('Password updated successfully!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          err.message ||
          'Failed to reset password. The link may have expired.'
      );
    } finally {
      setLoading(false);
    }
  };

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
