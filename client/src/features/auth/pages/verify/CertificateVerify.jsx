import { Input } from '@/components/ui';
import { Button } from '@/components/ui';
import { useState } from 'react';
import { HiSearch } from 'react-icons/hi';

export default function CertificateVerify() {
  const [certId, setCertId] = useState('');
  const [status, setStatus] = useState(null); // null | 'valid' | 'invalid'
  const [loading, setLoading] = useState(false);

  const handleVerify = e => {
    e.preventDefault();
    if (!certId.trim()) return;
    setLoading(true);
    // Simulate verification
    setTimeout(() => {
      setLoading(false);
      setStatus(certId.length > 5 ? 'valid' : 'invalid');
    }, 1500);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">🎓</div>
      <h1 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">Verify Certificate</h1>
      <p className="text-dark-500 mb-8">Enter a certificate ID to verify its authenticity</p>

      <form onSubmit={handleVerify} className="flex gap-2 mb-8">
        <Input
          value={certId}
          onChange={e => setCertId(e.target.value)}
          placeholder="Enter Certificate ID"
          icon={HiSearch}
          className="flex-1"
        />
        <Button type="submit" loading={loading}>Verify</Button>
      </form>

      {status === 'valid' && (
        <div className="card p-6 border-2 border-secondary-300 dark:border-secondary-700">
          <HiCheckCircle className="h-12 w-12 text-secondary-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-secondary-700 dark:text-secondary-400">Certificate is Valid ✓</h3>
          <p className="text-sm text-dark-500 mt-2">This certificate was issued by LearnHub.</p>
        </div>
      )}

      {status === 'invalid' && (
        <div className="card p-6 border-2 border-red-300 dark:border-red-700">
          <HiXCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Certificate Not Found</h3>
          <p className="text-sm text-dark-500 mt-2">Please check the ID and try again.</p>
        </div>
      )}
    </div>
  );
}
