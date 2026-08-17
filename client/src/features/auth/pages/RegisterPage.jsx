import { Input, Button } from '@/components/ui';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HiUser, HiMail, HiLockClosed, HiExclamationCircle, HiCheckCircle } from 'react-icons/hi';
import { register as registerUser } from '@/features/auth/authSlice';
import { authAPI } from '@/services/api';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    phone: z
      .string()
      .optional()
      .refine((val) => !val || /^\d{10}$/.test(val), 'Phone must be exactly 10 digits'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Please confirm your password'),
    role: z.enum(['student', 'teacher', 'parent']).default('student'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'student',
    },
  });

  const [serverError, setServerError] = useState('');
  const [emailStatus, setEmailStatus] = useState({ loading: false, available: null, message: '' });

  const passwordValue = watch('password');
  const roleValue = watch('role');

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: 'bg-dark-200 dark:bg-dark-700' };
    let score = 0;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score < 2) return { score, label: 'Weak', color: 'bg-red-500' };
    if (score === 2 || score === 3) return { score, label: 'Fair', color: 'bg-orange-500' };
    return { score, label: 'Strong', color: 'bg-green-500' };
  };

  const passwordStrength = getPasswordStrength(passwordValue);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleEmailBlur = async (e) => {
    const emailVal = e.target.value;
    if (!emailVal) return;

    const isValid = await trigger('email');
    if (!isValid) {
      setEmailStatus({ loading: false, available: false, message: 'Invalid email format' });
      return;
    }

    setEmailStatus({ loading: true, available: null, message: '' });
    try {
      const res = await authAPI.checkEmail(emailVal);
      if (res.data.data.available) {
        setEmailStatus({ loading: false, available: true, message: 'Email is available' });
      } else {
        setEmailStatus({
          loading: false,
          available: false,
          message: 'This email is already registered',
        });
      }
    } catch (error) {
      setEmailStatus({ loading: false, available: null, message: '' });
    }
  };

  const onSubmit = async (data) => {
    if (emailStatus.available === false) return;
    setServerError('');
    try {
      const result = await dispatch(registerUser(data));
      if (registerUser.rejected.match(result)) {
        setServerError(result.payload || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setServerError('Registration failed');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-950 shadow-premium rounded-2xl p-8 sm:p-10 border border-slate-200 dark:border-slate-800 animate-fade-in relative overflow-hidden transition-all duration-300">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          Create Account
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Start your learning journey today</p>
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
        <span className="text-slate-900 dark:text-slate-50 font-medium">Sign up with Google</span>
      </a>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white dark:bg-slate-950 text-slate-500 font-medium">
            Or register with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Input
            label="Full Name"
            {...register('name')}
            placeholder="John Doe"
            icon={HiUser}
            error={errors.name?.message}
          />
        </div>

        <div className="relative">
          <Input
            label="Email"
            type="email"
            {...register('email')}
            onBlur={(e) => {
              register('email').onBlur(e);
              handleEmailBlur(e);
            }}
            placeholder="john@example.com"
            icon={HiMail}
            error={
              errors.email?.message ||
              (emailStatus.available === false ? emailStatus.message : undefined)
            }
          />
          {emailStatus.loading && (
            <div className="absolute right-3 top-[38px] text-xs text-dark-400">Checking...</div>
          )}
          {emailStatus.available === true && !errors.email && (
            <HiCheckCircle className="absolute right-3 top-[36px] h-5 w-5 text-green-500" />
          )}
        </div>

        <div>
          <Input
            label="Password"
            type="password"
            {...register('password')}
            placeholder="Min 6 characters"
            icon={HiLockClosed}
            error={errors.password?.message}
          />
          {passwordValue && (
            <div className="mt-2">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Password strength:
                </span>
                <span
                  className={`text-xs font-medium ${passwordStrength.label === 'Weak' ? 'text-red-500' : passwordStrength.label === 'Fair' ? 'text-orange-500' : 'text-green-500'}`}
                >
                  {passwordStrength.label}
                </span>
              </div>
              <div className="flex gap-1 h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-transparent'} w-1/4 transition-all`}
                ></div>
                <div
                  className={`h-full ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-transparent'} w-1/4 transition-all`}
                ></div>
                <div
                  className={`h-full ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-transparent'} w-1/4 transition-all`}
                ></div>
                <div
                  className={`h-full ${passwordStrength.score >= 4 ? passwordStrength.color : 'bg-transparent'} w-1/4 transition-all`}
                ></div>
              </div>
            </div>
          )}
        </div>

        <div>
          <Input
            label="Confirm Password"
            type="password"
            {...register('confirmPassword')}
            placeholder="Repeat password"
            icon={HiLockClosed}
            error={errors.confirmPassword?.message}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            I want to
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'student', label: '📚 Learn', desc: 'Take courses & tests' },
              { value: 'teacher', label: '👨‍🏫 Teach', desc: 'Create & sell' },
              { value: 'parent', label: '👨‍👩‍👧‍👦 Monitor', desc: 'Track progress' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue('role', option.value)}
                className={`p-3 rounded-xl border-2 text-left transition-all duration-300 ${
                  roleValue === option.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-slate-900'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                  {option.label}
                </div>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{option.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {serverError && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2.5">
            <HiExclamationCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-400">{serverError}</p>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full !py-3 !rounded-xl text-base shadow-sm transition-all duration-300 hover:shadow-premium mt-4"
          loading={isSubmitting}
        >
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        Already have an account?{' '}
        <Link
          to="/login"
          className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
