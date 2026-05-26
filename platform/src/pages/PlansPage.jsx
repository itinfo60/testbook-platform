import { useEffect, useState } from 'react';
import { subscriptionPlansAPI } from '@/api';
import { CreditCard, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PlansPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    subscriptionPlansAPI
      .getAll()
      .then((res) => {
        const data = res.data?.data;
        setPlans(Array.isArray(data) ? data : data?.plans || []);
      })
      .catch(() => toast.error('Failed to load plans'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Subscription Plans</h1>
        <p className="text-gray-500 text-sm mt-1">Manage platform subscription tiers</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse space-y-4">
              <div className="h-5 bg-gray-800 rounded w-1/2" />
              <div className="h-8 bg-gray-800 rounded w-3/4" />
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-4 bg-gray-800 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="card p-12 text-center">
          <CreditCard className="h-12 w-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No subscription plans found</p>
          <p className="text-gray-600 text-sm mt-1">Plans are seeded via the server seed script</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div key={plan._id} className="card p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-gray-500 text-sm capitalize">
                    {plan.billingCycle || 'monthly'}
                  </p>
                </div>
                <div className="h-10 w-10 rounded-xl bg-blue-900/40 border border-blue-800 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-blue-400" />
                </div>
              </div>

              <div className="mb-5">
                <span className="text-3xl font-bold text-white">
                  ₹{Number(plan.price || 0).toLocaleString()}
                </span>
                <span className="text-gray-500 text-sm">/{plan.billingCycle || 'mo'}</span>
              </div>

              <div className="space-y-2.5 flex-1">
                {[
                  `${plan.limits?.studentLimit ?? '∞'} students`,
                  `${plan.limits?.teacherLimit ?? '∞'} teachers`,
                  `${plan.limits?.storageLimit ? Math.round(plan.limits.storageLimit / 1e9) + 'GB' : '∞'} storage`,
                  ...(plan.features || []),
                ].map((feat, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                    <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    {feat}
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-600">
                <span>ID: {plan._id?.slice(-8)}</span>
                <span className={plan.isActive !== false ? 'text-green-500' : 'text-gray-600'}>
                  {plan.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
