import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HiLockClosed } from 'react-icons/hi';
import { resetPassword, clearError, clearMessage } from '@/features/auth/authSlice';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, message } = useSelector(state => state.auth);
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });

  useEffect(() => {
    if (error) { toast.error(error); dispatch(clearError()); }
    if (message) { toast.success(message); dispatch(clearMessage()); setTimeout(() => navigate('/login'), 2000); }
  }, [error, message, dispatch, navigate]);

  const handleSubmit = e => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) { toast.error('Passwords do not match'); return; }
    dispatch(resetPassword({ token, password: formData.password }));
  };

  return (
    <div className="card p-6 sm:p-8 animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Reset Password</h1>
        <p className="text-dark-500 mt-1">Enter your new password</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="New Password" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} placeholder="Min 6 characters" icon={HiLockClosed} required />
        <Input label="Confirm Password" type="password" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} placeholder="Repeat password" icon={HiLockClosed} required />
        <Button type="submit" variant="primary" className="w-full" loading={loading}>Reset Password</Button>
      </form>
    </div>
  );
}
