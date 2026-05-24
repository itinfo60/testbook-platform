import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HiMail, HiLockClosed } from 'react-icons/hi';
import { login, clearError } from '@/features/auth/authSlice';
import { Input, Button } from '@/components/ui';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error, isAuthenticated } = useSelector(state => state.auth);
  const from = location.state?.from?.pathname || '/dashboard';

  const [formData, setFormData] = useState({ email: '', password: '' });

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    if (error) {
      console.error('❌ Login error:', error);
      toast.error(typeof error === 'string' ? error : 'Login failed. Check console.');
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Please fill all fields');
      return;
    }
    const result = await dispatch(login(formData));
  };

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const quickLogin = (email, password) => {
    setFormData({ email, password });
    // Auto-submit after state updates
    setTimeout(() => {
      dispatch(login({ email, password }));
    }, 100);
  };

  return (
    <div className="card p-6 sm:p-8 animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Welcome Back</h1>
        <p className="text-dark-500 mt-1">Sign in to continue learning</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
          icon={HiMail}
          required
        />
        <Input
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
          icon={HiLockClosed}
          required
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-dark-500">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium whitespace-nowrap">
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" variant="primary" className="w-full" loading={loading}>
          Sign In
        </Button>
      </form>

      {/* Quick Login Buttons */}
      <div className="mt-4 pt-4 border-t border-dark-100 dark:border-dark-700">
        <p className="text-xs text-dark-400 text-center mb-3">Quick login (Demo)</p>
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => quickLogin('student@testbook.com', 'Student@123456')}
            className="px-2 py-1.5 text-xs rounded-lg border border-dark-200 dark:border-dark-700 hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
          >
            Student
          </button>
          <button
            type="button"
            onClick={() => quickLogin('teacher@testbook.com', 'Teacher@123456')}
            className="px-2 py-1.5 text-xs rounded-lg border border-dark-200 dark:border-dark-700 hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
          >
            Teacher
          </button>
          <button
            type="button"
            onClick={() => quickLogin('admin@testbook.com', 'Admin@123456')}
            className="px-2 py-1.5 text-xs rounded-lg border border-dark-200 dark:border-dark-700 hover:bg-dark-50 dark:hover:bg-dark-800 transition-colors"
          >
            Admin
          </button>
        </div>
      </div>

      <p className="text-center text-sm text-dark-500 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">Sign up</Link>
      </p>
    </div>
  );
}
