import { useState } from 'react';
import { institutesAPI, subscriptionPlansAPI } from '@/api';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

export default function CreateInstituteModal({ onClose, onCreated }) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
              <input
                required
                className="input"
                placeholder="sharma"
                value={form.subdomain}
                onChange={(e) =>
                  set('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                }
              />
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
                      {p.name}
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
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Creating...' : 'Create Institute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
