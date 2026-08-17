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
  rememberMe: z.boolean().optional(),
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

  return (
    <div className="bg-white dark:bg-slate-950 shadow-premium rounded-2xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 animate-fade-in relative overflow-hidden transition-all duration-300">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Welcome Back
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Sign in to continue learning</p>
      </div>

      <a
        href={`${import.meta.env.VITE_API_URL || '/api/v1'}/auth/google`}
        className="flex items-center justify-center gap-3 w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:shadow-premium rounded-xl text-sm font-medium transition-all duration-300 mb-6 group"
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
        <span className="text-slate-900 dark:text-slate-50 font-medium">Continue with Google</span>
      </a>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white dark:bg-slate-950 text-slate-500 font-medium">
            Or sign in with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Email
          </label>
          <div className="relative">
            <HiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              {...register('email')}
              type="email"
              placeholder="Enter your email"
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-900 dark:text-slate-50 transition-all duration-300 shadow-sm"
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs mt-1 font-medium">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Password
          </label>
          <div className="relative">
            <HiLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              {...register('password')}
              type="password"
              placeholder="Enter your password"
              className="w-full pl-11 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-slate-900 dark:text-slate-50 transition-all duration-300 shadow-sm"
            />
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1 font-medium">{errors.password.message}</p>
          )}
        </div>

        {requiresMfa && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              MFA Token
            </label>
            <input
              {...register('mfaToken')}
              placeholder="6-digit code from authenticator app"
              maxLength={6}
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-primary-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-900 dark:text-slate-50 tracking-widest transition-all duration-300"
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
              {...register('rememberMe')}
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
          className="w-full !py-3 !rounded-xl text-base shadow-sm transition-all duration-300 hover:shadow-premium"
          loading={isSubmitting}
        >
          Sign In
        </Button>
      </form>

      {/* Quick Login Removed */}

      <p className="text-center text-sm text-slate-500 mt-6">
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
