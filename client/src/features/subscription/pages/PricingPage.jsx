import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { HiCheck, HiLightningBolt, HiStar, HiShieldCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';
import api from '@/services/api';

const PLAN_META = {
  starter: {
    icon: HiLightningBolt,
    color: 'blue',
    label: 'Starter',
    description: 'Perfect for small institutes just getting started.',
  },
  growth: {
    icon: HiStar,
    color: 'purple',
    label: 'Growth',
    description: 'Ideal for growing institutes with more students.',
    popular: true,
  },
  premium: {
    icon: HiShieldCheck,
    color: 'emerald',
    label: 'Premium',
    description: 'Enterprise-grade for large institutions.',
  },
};

const COLOR_MAP = {
  blue: {
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    btn: 'bg-blue-600 hover:bg-blue-700',
    ring: 'ring-blue-500',
    icon: 'text-blue-500',
  },
  purple: {
    badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    btn: 'bg-purple-600 hover:bg-purple-700',
    ring: 'ring-purple-500',
    icon: 'text-purple-500',
  },
  emerald: {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    btn: 'bg-emerald-600 hover:bg-emerald-700',
    ring: 'ring-emerald-500',
    icon: 'text-emerald-500',
  },
};

function formatStorage(bytes) {
  const gb = bytes / 1024 ** 3;
  return gb >= 1 ? `${gb} GB` : `${bytes / 1024 ** 2} MB`;
}

export default function PricingPage() {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, subRes] = await Promise.all([
          api.get('/subscriptions'),
          user ? api.get('/subscriptions/my').catch(() => null) : Promise.resolve(null),
        ]);
        setPlans(plansRes.data?.data?.plans || []);
        if (subRes) setCurrentPlan(subRes.data?.data?.subscription?.plan?._id);
      } catch {
        toast.error('Failed to load plans');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleUpgrade = async (plan) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      toast.error('Only institute admins can manage subscriptions');
      return;
    }
    setUpgrading(plan._id);
    try {
      await api.post('/subscriptions/upgrade', { planId: plan._id });
      setCurrentPlan(plan._id);
      toast.success(`Upgraded to ${PLAN_META[plan.name]?.label || plan.name} plan!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upgrade failed');
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-16 px-4 bg-gradient-to-br from-slate-50 to-white dark:from-dark-900 dark:to-dark-800">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 rounded-full mb-4">
            Pricing
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-white mb-4">
            Choose your plan
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
            Scale from small institutes to enterprise deployments. All plans include core LMS
            features.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const meta = PLAN_META[plan.name] || { icon: HiCheck, color: 'blue', label: plan.name };
            const colors = COLOR_MAP[meta.color];
            const isCurrent =
              currentPlan === plan._id || currentPlan?.toString() === plan._id?.toString();
            const Icon = meta.icon;

            return (
              <div
                key={plan._id}
                className={`relative flex flex-col rounded-3xl border bg-white dark:bg-dark-800 p-8 shadow-sm hover:shadow-xl transition-all duration-300 ${meta.popular ? `ring-2 ${colors.ring}` : 'border-slate-200 dark:border-dark-700'}`}
              >
                {meta.popular && (
                  <div
                    className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 text-xs font-bold uppercase tracking-wider rounded-full text-white ${colors.btn}`}
                  >
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <div
                    className={`inline-flex items-center justify-center h-12 w-12 rounded-2xl mb-4 ${colors.badge}`}
                  >
                    <Icon className={`h-6 w-6 ${colors.icon}`} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {meta.label || plan.name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                    {meta.description}
                  </p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">
                    ₹{plan.price.toLocaleString()}
                  </span>
                  <span className="text-slate-600 dark:text-slate-400 ml-1">
                    /{plan.billingCycle === 'yearly' ? 'yr' : 'mo'}
                  </span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {[
                    `${plan.studentLimit.toLocaleString()} students`,
                    `${plan.teacherLimit} teachers`,
                    `${formatStorage(plan.storageLimit)} storage`,
                    ...(plan.features || []),
                  ].map((f, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300"
                    >
                      <HiCheck className={`h-4 w-4 flex-shrink-0 ${colors.icon}`} />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="py-3 px-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-dark-600 text-center text-sm font-semibold text-slate-600 dark:text-slate-400">
                    Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(plan)}
                    disabled={!!upgrading}
                    className={`w-full py-3 px-6 rounded-xl text-sm font-bold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed ${colors.btn} shadow-lg hover:-translate-y-0.5`}
                  >
                    {upgrading === plan._id ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Upgrading...
                      </span>
                    ) : (
                      `Get ${meta.label || plan.name}`
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-center text-sm text-slate-400 dark:text-slate-500 mt-10">
          All plans include a 14-day free trial. No credit card required. Cancel anytime.
        </p>
      </div>
    </div>
  );
}
