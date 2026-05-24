import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { HiUser, HiMail, HiLockClosed, HiExclamationCircle } from 'react-icons/hi';
import { register } from '@/features/auth/authSlice';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useSelector(state => state.auth);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', confirmPassword: '', role: 'student',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const handleChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (serverError) setServerError('');
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setServerError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setServerError('Password must be at least 6 characters');
      return;
    }
    setIsSubmitting(true);
    setServerError('');
    const { confirmPassword, ...data } = formData;
    try {
      const result = await dispatch(register(data));
      if (register.rejected.match(result)) {
        setServerError(result.payload || 'Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card p-6 sm:p-8 animate-fade-in">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white">Create Account</h1>
        <p className="text-dark-500 mt-1">Start your learning journey today</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Full Name" name="name" value={formData.name} onChange={handleChange} placeholder="John Doe" icon={HiUser} required />
        <Input label="Email" type="email" name="email" value={formData.email} onChange={handleChange} placeholder="john@example.com" icon={HiMail} required />
        <Input label="Password" type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Min 6 characters" icon={HiLockClosed} required />
        <Input label="Confirm Password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Repeat password" icon={HiLockClosed} required />

        <div>
          <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1.5">I want to</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'student', label: '📚 Learn', desc: 'Take courses & tests' },
              { value: 'teacher', label: '👨‍🏫 Teach', desc: 'Create & sell courses' },
            ].map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData({ ...formData, role: option.value })}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  formData.role === option.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/30'
                    : 'border-dark-200 dark:border-dark-700 hover:border-dark-300'
                }`}
              >
                <div className="text-sm font-medium text-dark-900 dark:text-white">{option.label}</div>
                <div className="text-xs text-dark-400">{option.desc}</div>
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

        <Button type="submit" variant="primary" className="w-full" loading={isSubmitting}>
          Create Account
        </Button>
      </form>

      <p className="text-center text-sm text-dark-500 mt-6">
        Already have an account?{' '}
        <Link to="/login" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium">Sign in</Link>
      </p>
    </div>
  );
}
