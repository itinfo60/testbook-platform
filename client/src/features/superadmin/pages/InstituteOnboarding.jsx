import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { HiCheck, HiArrowLeft, HiArrowRight, HiOfficeBuilding } from 'react-icons/hi';
import api from '@/services/api';
import toast from 'react-hot-toast';

const step1Schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  subdomain: z
    .string()
    .min(3, 'Subdomain must be at least 3 characters')
    .max(30)
    .regex(/^[a-z0-9-]+$/, 'Only lowercase letters, numbers, and hyphens'),
  email: z.string().email('Invalid email'),
  phone: z.string().regex(/^\d{10}$/, '10-digit phone number required'),
});

const step2Schema = z.object({
  adminName: z.string().min(2, 'Name required'),
  adminEmail: z.string().email('Invalid email'),
  adminPassword: z
    .string()
    .min(8)
    .regex(/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/, 'Password must have uppercase, lowercase, and number'),
  planId: z.string().min(1, 'Select a plan'),
});

const STEPS = ['Institute Details', 'Admin Account', 'Confirm'];

export default function InstituteOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});
  const [plans, setPlans] = useState([]);
  const [subdomainAvailable, setSubdomainAvailable] = useState(null);
  const [checking, setChecking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form1 = useForm({ resolver: zodResolver(step1Schema) });
  const form2 = useForm({ resolver: zodResolver(step2Schema) });

  const checkSubdomain = async (subdomain) => {
    if (!subdomain || subdomain.length < 3) return;
    setChecking(true);
    try {
      await api.get(`/institutes/check-subdomain/${subdomain}`);
      setSubdomainAvailable(true);
    } catch {
      setSubdomainAvailable(false);
    } finally {
      setChecking(false);
    }
  };

  const onStep1 = form1.handleSubmit(async (values) => {
    setData((prev) => ({ ...prev, ...values }));
    // Load plans
    try {
      const { data: res } = await api.get('/subscriptions');
      setPlans(res.data?.plans || []);
    } catch {
      /* ignore */
    }
    setStep(1);
  });

  const onStep2 = form2.handleSubmit((values) => {
    setData((prev) => ({ ...prev, ...values }));
    setStep(2);
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post('/institutes/onboard', data);
      toast.success('Institute onboarded successfully!');
      navigate('/super-admin');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Onboarding failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary-600 mb-4">
            <HiOfficeBuilding className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Onboard New Institute</h1>
          <p className="text-slate-400 text-sm mt-1">Set up a new white-label LMS in minutes</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1 flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  i < step
                    ? 'bg-green-500 text-white'
                    : i === step
                      ? 'bg-primary-600 text-white'
                      : 'bg-slate-800 text-slate-500'
                }`}
              >
                {i < step ? <HiCheck className="h-4 w-4" /> : i + 1}
              </div>
              <span
                className={`text-xs hidden sm:block ${i === step ? 'text-white' : 'text-slate-500'}`}
              >
                {s}
              </span>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 ${i < step ? 'bg-green-500' : 'bg-slate-800'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          {/* Step 1 */}
          {step === 0 && (
            <form onSubmit={onStep1} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Institute Name</label>
                <input
                  {...form1.register('name')}
                  placeholder="Acme Learning"
                  className="w-full bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {form1.formState.errors.name && (
                  <p className="text-red-400 text-xs mt-1">{form1.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Subdomain</label>
                <div className="flex items-center gap-2">
                  <input
                    {...form1.register('subdomain')}
                    placeholder="acme"
                    className="flex-1 bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    onBlur={(e) => checkSubdomain(e.target.value)}
                  />
                  <span className="text-slate-500 text-sm">.yourplatform.com</span>
                </div>
                {checking && (
                  <p className="text-slate-400 text-xs mt-1">Checking availability...</p>
                )}
                {subdomainAvailable === true && (
                  <p className="text-green-400 text-xs mt-1">✓ Available</p>
                )}
                {subdomainAvailable === false && (
                  <p className="text-red-400 text-xs mt-1">✗ Already taken</p>
                )}
                {form1.formState.errors.subdomain && (
                  <p className="text-red-400 text-xs mt-1">
                    {form1.formState.errors.subdomain.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Contact Email</label>
                <input
                  {...form1.register('email')}
                  type="email"
                  placeholder="contact@acme.com"
                  className="w-full bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {form1.formState.errors.email && (
                  <p className="text-red-400 text-xs mt-1">
                    {form1.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Phone</label>
                <input
                  {...form1.register('phone')}
                  placeholder="9876543210"
                  className="w-full bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {form1.formState.errors.phone && (
                  <p className="text-red-400 text-xs mt-1">
                    {form1.formState.errors.phone.message}
                  </p>
                )}
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                Next <HiArrowRight className="h-4 w-4" />
              </button>
            </form>
          )}

          {/* Step 2 */}
          {step === 1 && (
            <form onSubmit={onStep2} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Admin Name</label>
                <input
                  {...form2.register('adminName')}
                  placeholder="John Doe"
                  className="w-full bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {form2.formState.errors.adminName && (
                  <p className="text-red-400 text-xs mt-1">
                    {form2.formState.errors.adminName.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Admin Email</label>
                <input
                  {...form2.register('adminEmail')}
                  type="email"
                  placeholder="admin@acme.com"
                  className="w-full bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {form2.formState.errors.adminEmail && (
                  <p className="text-red-400 text-xs mt-1">
                    {form2.formState.errors.adminEmail.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Admin Password</label>
                <input
                  {...form2.register('adminPassword')}
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                {form2.formState.errors.adminPassword && (
                  <p className="text-red-400 text-xs mt-1">
                    {form2.formState.errors.adminPassword.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Subscription Plan</label>
                <select
                  {...form2.register('planId')}
                  className="w-full bg-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select plan...</option>
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} — ₹{p.price}/{p.billingCycle}
                    </option>
                  ))}
                </select>
                {form2.formState.errors.planId && (
                  <p className="text-red-400 text-xs mt-1">
                    {form2.formState.errors.planId.message}
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <HiArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  Next <HiArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Confirm */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-white font-semibold">Review & Confirm</h2>
              <div className="bg-slate-800 rounded-xl p-4 space-y-2 text-sm">
                {[
                  ['Institute', data.name],
                  ['Subdomain', `${data.subdomain}.yourplatform.com`],
                  ['Contact', data.email],
                  ['Admin', `${data.adminName} (${data.adminEmail})`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <span className="text-slate-400">{k}</span>
                    <span className="text-white">{v}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <HiArrowLeft className="h-4 w-4" /> Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    'Creating...'
                  ) : (
                    <>
                      <HiCheck className="h-4 w-4" /> Confirm & Create
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
