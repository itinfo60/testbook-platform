import { useState, useEffect, useRef } from 'react';
import { institutesAPI, subscriptionPlansAPI } from '@/api';
import api from '@/api';
import toast from 'react-hot-toast';
import { X, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function CreateInstituteModal({ onClose, onCreated }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [subdomainStatus, setSubdomainStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const checkTimeout = useRef(null);

  const [form, setForm] = useState({
    name: '',
    subdomain: '',
    ownerEmail: '',
    ownerName: '',
    ownerPassword: '',
    planId: '',
    expiresAt: '',
    studentLimit: 100,
    teacherLimit: 5,
  });

  useEffect(() => {
    subscriptionPlansAPI
      .getAll()
      .then((res) => setPlans(res.data?.data?.plans || res.data?.data || []))
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubdomainChange = (raw) => {
    const val = raw.toLowerCase().replace(/[^a-z0-9-]/g, '');
    set('subdomain', val);
    setSubdomainStatus(null);
    clearTimeout(checkTimeout.current);
    if (val.length < 3) return;
    setSubdomainStatus('checking');
    checkTimeout.current = setTimeout(async () => {
      try {
        await api.get(`/institutes/check-subdomain/${val}`);
        setSubdomainStatus('available');
      } catch {
        setSubdomainStatus('taken');
      }
    }, 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (subdomainStatus === 'taken') {
      toast.error('Subdomain is already taken');
      return;
    }
    setLoading(true);
    try {
      await institutesAPI.create(form);
      toast.success('Institute created successfully');
      onCreated();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create institute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-lg font-semibold text-white">Create New Institute</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                Institute Name *
              </label>
              <input
                required
                className="input"
                placeholder="Sharma Classes"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Subdomain *</label>
              <div className="relative">
                <input
                  required
                  className={`input pr-8 ${
                    subdomainStatus === 'taken'
                      ? 'border-red-700 focus:ring-red-700'
                      : subdomainStatus === 'available'
                        ? 'border-green-700 focus:ring-green-700'
                        : ''
                  }`}
                  placeholder="sharma"
                  value={form.subdomain}
                  onChange={(e) => handleSubdomainChange(e.target.value)}
                />
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  {subdomainStatus === 'checking' && (
                    <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                  )}
                  {subdomainStatus === 'available' && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {subdomainStatus === 'taken' && <XCircle className="h-4 w-4 text-red-500" />}
                </div>
              </div>
              {subdomainStatus === 'available' && (
                <p className="text-green-500 text-xs mt-1">Available</p>
              )}
              {subdomainStatus === 'taken' && (
                <p className="text-red-500 text-xs mt-1">Already taken</p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Owner Account
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Owner Name *
                </label>
                <input
                  required
                  className="input"
                  placeholder="Ramesh Sharma"
                  value={form.ownerName}
                  onChange={(e) => set('ownerName', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Owner Email *
                </label>
                <input
                  required
                  type="email"
                  className="input"
                  placeholder="owner@example.com"
                  value={form.ownerEmail}
                  onChange={(e) => set('ownerEmail', e.target.value)}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Owner Password *
                </label>
                <input
                  required
                  type="password"
                  className="input"
                  placeholder="Min 8 characters"
                  value={form.ownerPassword}
                  onChange={(e) => set('ownerPassword', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Subscription
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Plan</label>
                <select
                  className="input"
                  value={form.planId}
                  onChange={(e) => set('planId', e.target.value)}
                >
                  <option value="">Select plan</option>
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.price ? `— ₹${p.price}/${p.billingCycle || 'mo'}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Expires At *
                </label>
                <input
                  required
                  type="date"
                  className="input"
                  value={form.expiresAt}
                  onChange={(e) => set('expiresAt', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Student Limit
                </label>
                <input
                  type="number"
                  className="input"
                  value={form.studentLimit}
                  onChange={(e) => set('studentLimit', Number(e.target.value))}
                  min={1}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Teacher Limit
                </label>
                <input
                  type="number"
                  className="input"
                  value={form.teacherLimit}
                  onChange={(e) => set('teacherLimit', Number(e.target.value))}
                  min={1}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || subdomainStatus === 'taken' || subdomainStatus === 'checking'}
              className="btn-primary flex-1"
            >
              {loading ? 'Creating...' : 'Create Institute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
