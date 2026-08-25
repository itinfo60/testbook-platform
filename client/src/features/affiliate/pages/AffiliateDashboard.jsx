import { useEffect, useState } from 'react';
import { HiLink, HiCurrencyRupee, HiUsers, HiClipboard, HiCheck } from 'react-icons/hi';
import api from '@/services/api';
import toast from 'react-hot-toast';

export default function AffiliateDashboard() {
  const [affiliate, setAffiliate] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchAffiliate();
  }, []);

  const fetchAffiliate = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/affiliate/me');
      setAffiliate(data.data?.affiliate);
      setRecords(data.data?.records || []);
    } catch {
      // Not registered yet
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
    setRegistering(true);
    try {
      const { data } = await api.post('/affiliate/register');
      setAffiliate(data.data?.affiliate);
      toast.success('Affiliate account created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const copyLink = () => {
    if (!affiliate) return;
    const link = `${window.location.origin}/register?ref=${affiliate.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Referral link copied!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-4">
          <div className="h-16 w-16 rounded-full bg-primary-600/20 flex items-center justify-center mx-auto">
            <HiLink className="h-8 w-8 text-primary-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Join the Affiliate Program</h2>
          <p className="text-slate-400 text-sm">
            Earn 10% commission on every successful referral. Share your unique link and track
            earnings in real-time.
          </p>
          <button
            onClick={register}
            disabled={registering}
            className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
          >
            {registering ? 'Creating account...' : 'Register as Affiliate'}
          </button>
        </div>
      </div>
    );
  }

  const referralLink = `${window.location.origin}/register?ref=${affiliate.referralCode}`;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-2xl font-bold text-white">Affiliate Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Referral Code',
            value: affiliate.referralCode,
            icon: HiLink,
            color: 'text-blue-400',
          },
          {
            label: 'Total Referrals',
            value: affiliate.totalReferrals,
            icon: HiUsers,
            color: 'text-green-400',
          },
          {
            label: 'Total Earnings',
            value: `₹${affiliate.totalEarnings}`,
            icon: HiCurrencyRupee,
            color: 'text-yellow-400',
          },
          {
            label: 'Pending Payout',
            value: `₹${affiliate.pendingPayout}`,
            icon: HiCurrencyRupee,
            color: 'text-emerald-400',
          },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <stat.icon className={`h-5 w-5 ${stat.color} mb-2`} />
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-slate-400 text-xs">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Referral Link */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h2 className="text-white font-semibold mb-3">Your Referral Link</h2>
        <div className="flex items-center gap-3">
          <input
            readOnly
            value={referralLink}
            className="flex-1 bg-slate-800 text-slate-300 text-sm rounded-xl px-4 py-2.5 focus:outline-none"
          />
          <button
            onClick={copyLink}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
          >
            {copied ? <HiCheck className="h-4 w-4" /> : <HiClipboard className="h-4 w-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-slate-500 text-xs mt-2">
          Commission rate: {affiliate.commissionRate}% on every successful enrollment
        </p>
      </div>

      {/* Referral Records */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h2 className="text-white font-semibold">Referral History</h2>
        </div>
        {records.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            No referrals yet. Share your link to start earning!
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-800">
                {['User', 'Date', 'Commission', 'Status'].map((h) => (
                  <th key={h} className="text-left text-slate-400 text-xs px-4 py-3">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {records.map((r) => (
                <tr key={r.id || r._id}>
                  <td className="px-4 py-3 text-slate-300 text-sm">{r.referred?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-emerald-400 text-sm">₹{r.commissionAmount}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        r.status === 'paid'
                          ? 'bg-green-500/20 text-green-400'
                          : r.status === 'approved'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
