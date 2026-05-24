import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HiMail } from 'react-icons/hi';
import { forgotPassword, clearError, clearMessage } from '@/features/auth/authSlice';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const dispatch = useDispatch();
  const { loading, error, message } = useSelector(state => state.auth);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
    if (message) { toast.success(message); dispatch(clearMessage()); setSent(true); }
  }, [error, message, dispatch]);

  const handleSubmit = e => {
    e.preventDefault();
    if (!email) { toast.error('Please enter email'); return; }
    dispatch(forgotPassword(email));
  };

  return (
    <div className="card p-6 sm:p-8 animate-fade-in">
      <Link to="/login" className="inline-flex items-center gap-1 text-sm text-dark-500 hover:text-dark-700 dark:hover:text-dark-300 mb-6">
        <HiArrowLeft className="h-4 w-4" /> Back to login
      </Link>

      {sent ? (
        <div className="text-center py-4">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">Check Your Email</h1>
          <p className="text-dark-500">We've sent a reset link to <strong>{email}</strong></p>
        </div>
      ) : (
        <>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Forgot Password?</h1>
            <p className="text-dark-500 mt-1">No worries, we'll send you a reset link</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" icon={HiMail} required />
            <Button type="submit" variant="primary" className="w-full" loading={loading}>Send Reset Link</Button>
          </form>
        </>
      )}
    </div>
  );
}
