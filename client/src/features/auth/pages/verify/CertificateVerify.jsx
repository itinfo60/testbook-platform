import { Input, Button } from '@/components/ui';
import { useState } from 'react';
import { HiSearch, HiCheckCircle, HiXCircle } from 'react-icons/hi';

export default function CertificateVerify() {
  const [certId, setCertId] = useState('');
  const [status, setStatus] = useState(null); // null | 'valid' | 'invalid'
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!certId.trim()) return;
    setLoading(true);
    setStatus(null);
    setDetails(null);
    try {
      const response = await fetch(
        `/api/v1/enrollments/verify-certificate/${certId.trim().toUpperCase()}`
      );
      const data = await response.json();
      if (response.ok && (data?.data?.valid || data?.valid)) {
        setStatus('valid');
        setDetails(data.data || data);
      } else {
        setStatus('invalid');
      }
    } catch (err) {
      setStatus('invalid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="text-5xl mb-4">🎓</div>
      <h1 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">Verify Certificate</h1>
      <p className="text-dark-500 mb-8">Enter a certificate ID to verify its authenticity</p>

      <form onSubmit={handleVerify} className="flex gap-2 mb-8">
        <Input
          value={certId}
          onChange={(e) => setCertId(e.target.value)}
          placeholder="Enter Certificate ID"
          icon={HiSearch}
          className="flex-1"
        />
        <Button type="submit" loading={loading}>
          Verify
        </Button>
      </form>

      {status === 'valid' && details && (
        <div className="card p-6 border-2 border-secondary-500 dark:border-secondary-500 bg-secondary-50/50 dark:bg-secondary-900/10 text-left">
          <div className="flex items-center gap-3 mb-4">
            <HiCheckCircle className="h-8 w-8 text-secondary-500 flex-shrink-0" />
            <h3 className="text-lg font-semibold text-secondary-700 dark:text-secondary-400">
              Certificate is Valid ✓
            </h3>
          </div>
          <div className="space-y-2 text-sm text-dark-600 dark:text-dark-300">
            <p>
              <strong>Student Name:</strong> {details.studentName}
            </p>
            <p>
              <strong>Course:</strong> {details.courseTitle}
            </p>
            <p>
              <strong>Issued On:</strong>{' '}
              {new Date(details.issuedAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
            <p>
              <strong>Certificate ID:</strong> {details.certificateId}
            </p>
          </div>
          {details.certificateUrl && (
            <a
              href={details.certificateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-block text-xs mt-4"
            >
              View PDF Certificate
            </a>
          )}
        </div>
      )}

      {status === 'invalid' && (
        <div className="card p-6 border-2 border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-900/10">
          <HiXCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">
            Certificate Not Found
          </h3>
          <p className="text-sm text-dark-500 mt-2">Please check the ID and try again.</p>
        </div>
      )}
    </div>
  );
}
