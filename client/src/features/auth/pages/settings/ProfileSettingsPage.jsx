import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HiUser, HiMail, HiPhone, HiKey } from 'react-icons/hi';
import { updateProfile, clearError, clearMessage, getProfile } from '@/features/auth/authSlice';
import { authAPI } from '@/services/api';
import toast from 'react-hot-toast';
import MfaSetup from '@/features/auth/components/MfaSetup';

export default function ProfileSettingsPage() {
  const dispatch = useDispatch();
  const { user, loading, error, message } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearError());
    }
    if (message) {
      toast.success(message);
      dispatch(clearMessage());
    }
  }, [error, message, dispatch]);

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    dispatch(updateProfile(formData));
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password updated successfully');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update password');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="section-title mb-8">Settings</h1>

      {/* Profile Settings */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
          Profile Information
        </h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <Input
            label="Full Name"
            icon={HiUser}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            icon={HiMail}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            disabled
          />
          <Input
            label="Phone"
            icon={HiPhone}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="Enter phone number"
          />
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">
              Bio
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="input-field min-h-[100px] resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>
          <Button type="submit" loading={loading}>
            Save Changes
          </Button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">
          Change Password
        </h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            value={passwordData.currentPassword}
            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
            required
          />
          <Input
            label="New Password"
            type="password"
            value={passwordData.newPassword}
            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
            required
          />
          <Input
            label="Confirm New Password"
            type="password"
            value={passwordData.confirmPassword}
            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
            required
          />
          <Button type="submit" loading={loading}>
            Update Password
          </Button>
        </form>
      </div>

      {/* MFA Setup */}
      <MfaSetup onStatusChange={() => dispatch(getProfile())} />
    </div>
  );
}
