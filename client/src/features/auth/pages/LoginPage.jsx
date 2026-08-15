import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { HiMail, HiLockClosed, HiExclamationCircle } from 'react-icons/hi';
import { login, verifyMfaLogin } from '@/features/auth/authSlice';
import { Button } from '@/components/ui';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  mfaToken: z.string().optional(),
});

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const from = location.state?.from?.pathname || '/dashboard';
  const [serverError, setServerError] = useState('');
  const [requiresMfa, setRequiresMfa] = useState(false);
  const [mfaUserId, setMfaUserId] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, navigate, from]);

  const onSubmit = async (data) => {
    setServerError('');

    if (requiresMfa) {
      const result = await dispatch(verifyMfaLogin({ userId: mfaUserId, token: data.mfaToken }));
      if (verifyMfaLogin.rejected.match(result)) {
        setServerError(result.payload || 'Invalid MFA code');
      }
      return;
    }

    const result = await dispatch(login(data));
    if (login.rejected.match(result)) {
      setServerError(result.payload || 'Invalid email or password');
    } else if (result.payload?.requiresMfa) {
      setMfaUserId(result.payload.userId);
      setRequiresMfa(true);
    }
  };

  const quickLogin = async (email, password) => {
    setValue('email', email);
    setValue('password', password);
    setServerError('');
    const result = await dispatch(login({ email, password }));
    if (login.rejected.match(result)) {
      setServerError(result.payload || 'Login failed');
    }
  };

  return (
    <div className="bg-white dark:bg-dark-900 shadow-2xl rounded-3xl p-8 sm:p-10 border border-slate-200 dark:border-dark-800 animate-fade-in relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 blur-3xl rounded-full -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-secondary-500/10 blur-3xl rounded-full -z-10 pointer-events-none"></div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-dark-900 dark:text-white font-display">
          Welcome Back
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Sign in to continue learning</p>
      </div>

      <a
        href={`${import.meta.env.VITE_API_URL || '/api/v1'}/auth/google`}
        className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 hover:bg-slate-50 dark:hover:bg-dark-750 hover:shadow-md rounded-2xl text-sm font-bold transition-all mb-6 group"
      >
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          xmlns="http://www.w3.org/2000/svg"
          className="group-hover:scale-110 transition-transform"
        >
          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
            <path
              fill="#4285F4"
              d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
            />
            <path
              fill="#34A853"
              d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
            />
            <path
              fill="#FBBC05"
              d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
            />
            <path
              fill="#EA4335"
              d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
            />
          </g>
        </svg>
        <span className="text-dark-900 dark:text-white">Continue with Google</span>
      </a>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-dark-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white dark:bg-dark-900 text-slate-500 font-medium">
            Or sign in with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-dark-700 dark:text-dark-300 mb-1.5">
            Email
          </label>
          <div className="relative">
            <HiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              {...register('email')}
              type="email"
              placeholder="Enter your email"
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-dark-900 dark:text-white transition-all shadow-sm"
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-bold text-dark-700 dark:text-dark-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <HiLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              {...register('password')}
              type="password"
              placeholder="Enter your password"
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-dark-900 dark:text-white transition-all shadow-sm"
            />
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>
          )}
        </div>

        {requiresMfa && (
          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
              MFA Token
            </label>
            <input
              {...register('mfaToken')}
              placeholder="6-digit code from authenticator app"
              maxLength={6}
              className="w-full px-4 py-2.5 bg-white dark:bg-dark-800 border border-primary-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-dark-900 dark:text-white tracking-widest"
            />
          </div>
        )}

        {serverError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2.5">
            <HiExclamationCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{serverError}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
            />
            <span className="text-sm font-medium text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
              Remember me
            </span>
          </label>
          <Link
            to="/forgot-password"
            className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 font-bold whitespace-nowrap transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full !py-3.5 !rounded-2xl text-base shadow-lg shadow-primary-500/20"
          loading={isSubmitting}
        >
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
        <Link
          to="/register"
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
