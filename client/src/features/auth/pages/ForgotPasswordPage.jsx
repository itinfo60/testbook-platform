import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { HiMail, HiArrowLeft } from 'react-icons/hi';
import supabase from '@/services/supabase';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      // Supabase sends the password reset email with a link to /reset-password
      const { error: sbError } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (sbError) {
        throw sbError;
      }

      setSent(true);
      toast.success('Password reset link sent to your email!');
    } catch (err) {
      toast.error(err.message || 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6 sm:p-8 animate-fade-in">
      <Link
        to="/login"
        className="inline-flex items-center gap-1 text-sm text-dark-500 hover:text-dark-700 dark:hover:text-dark-300 mb-6"
      >
        <HiArrowLeft className="h-4 w-4" /> Back to login
      </Link>

      {sent ? (
        <div className="text-center py-4">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">
            Check Your Email
          </h1>
          <p className="text-dark-500">
            We've sent a reset link to <strong>{email}</strong>
          </p>
        </div>
      ) : (
        <>
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Forgot Password?</h1>
            <p className="text-dark-500 mt-1">No worries, we'll send you a reset link</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              icon={HiMail}
              required
            />
            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Send Reset Link
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
