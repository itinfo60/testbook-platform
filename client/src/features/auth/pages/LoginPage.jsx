import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HiMail, HiLockClosed, HiExclamationCircle } from 'react-icons/hi';
import { login } from '@/features/auth/authSlice';
import { Input, Button } from '@/components/ui';

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector(state => state.auth);
  const from = location.state?.from?.pathname || '/dashboard';

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setServerError('Please fill in all fields');
      return;
    }
    setIsSubmitting(true);
    setServerError('');
    try {
      const result = await dispatch(login(formData));
      if (login.rejected.match(result)) {
        setServerError(result.payload || 'Invalid email or password');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickLogin = async (email, password) => {
    setFormData({ email, password });
    setServerError('');
    setIsSubmitting(true);
    try {
      const result = await dispatch(login({ email, password }));
      if (login.rejected.match(result)) {
        setServerError(result.payload || 'Login failed');
      }
    } finally {
      setIsSubmitting(false);
    }
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

        {serverError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2.5">
            <HiExclamationCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{serverError}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-primary-500" />
            <span className="text-sm text-dark-500">Remember me</span>
          </label>
          <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium whitespace-nowrap">
            Forgot Password?
          </Link>
        </div>

        <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>
          Sign In
        </Button>
      </form>

      {/* Quick Login — Student & Teacher only */}
      <div className="mt-4 pt-4 border-t border-dark-100 dark:border-dark-700">
        <p className="text-xs text-dark-400 text-center mb-3">Quick demo login</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => quickLogin('arjun@student.com', 'Student@123456')}
            className="flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 hover:bg-primary-50 dark:hover:bg-primary-950/30 hover:border-primary-300 dark:hover:border-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-lg">📚</span>
            <span className="text-xs font-medium text-dark-700 dark:text-dark-300">Student</span>
            <span className="text-[10px] text-dark-400">arjun@student.com</span>
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => quickLogin('teacher@testbook.com', 'Teacher@123456')}
            className="flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl border border-dark-200 dark:border-dark-700 hover:bg-secondary-50 dark:hover:bg-secondary-950/30 hover:border-secondary-300 dark:hover:border-secondary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="text-lg">👨‍🏫</span>
            <span className="text-xs font-medium text-dark-700 dark:text-dark-300">Teacher</span>
            <span className="text-[10px] text-dark-400">teacher@testbook.com</span>
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
