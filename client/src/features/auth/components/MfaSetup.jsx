import { useState } from 'react';
import { useSelector } from 'react-redux';
import { HiShieldCheck, HiShieldExclamation, HiX } from 'react-icons/hi';
import { Button } from '@/components/ui';
import { authAPI } from '@/services/api';
import toast from 'react-hot-toast';

/**
 * TOTP MFA setup / disable widget for the settings page.
 * Calls POST /auth/mfa/setup → shows QR code → verify 6-digit code → enabled.
 */
export default function MfaSetup({ onStatusChange }) {
  const { user } = useSelector((s) => s.auth);
  const mfaEnabled = user?.mfaEnabled ?? false;

  const [step, setStep] = useState('idle'); // idle | setup | verify | disable
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);

  const startSetup = async () => {
    setLoading(true);
    try {
      const { data } = await authAPI.setupMfa();
      setQrCodeUrl(data.data?.qrCode);
      setSecret(data.data?.secret);
      setStep('verify');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start MFA setup');
    } finally {
      setLoading(false);
    }
  };

  const confirmSetup = async () => {
    if (token.length !== 6) {
      toast.error('Enter the 6-digit code from your authenticator app');
      return;
    }
    setLoading(true);
    try {
      await authAPI.verifyMfa(token);
      toast.success('MFA enabled successfully');
      setStep('idle');
      setToken('');
      onStatusChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmDisable = async () => {
    if (token.length !== 6) {
      toast.error('Enter your current 6-digit code to disable MFA');
      return;
    }
    setLoading(true);
    try {
      await authAPI.disableMfa(token);
      toast.success('MFA disabled');
      setStep('idle');
      setToken('');
      onStatusChange?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {mfaEnabled ? (
            <HiShieldCheck className="h-5 w-5 text-green-500" />
          ) : (
            <HiShieldExclamation className="h-5 w-5 text-yellow-500" />
          )}
          <h2 className="text-lg font-semibold text-dark-900 dark:text-white">
            Two-Factor Authentication
          </h2>
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${mfaEnabled ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}
        >
          {mfaEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      <p className="text-sm text-dark-500 dark:text-dark-400 mb-4">
        {mfaEnabled
          ? 'Your account is protected with TOTP-based two-factor authentication.'
          : 'Add an extra layer of security by requiring a code from your authenticator app on every login.'}
      </p>

      {/* Idle state */}
      {step === 'idle' && (
        <div className="flex gap-3">
          {!mfaEnabled && (
            <Button onClick={startSetup} loading={loading} variant="primary" size="sm">
              Enable MFA
            </Button>
          )}
          {mfaEnabled && (
            <Button onClick={() => setStep('disable')} variant="danger" size="sm">
              Disable MFA
            </Button>
          )}
        </div>
      )}

      {/* QR code + verify step */}
      {step === 'verify' && (
        <div className="space-y-4">
          <div className="bg-dark-50 dark:bg-dark-800 rounded-xl p-4 text-center">
            <p className="text-sm text-dark-600 dark:text-dark-300 mb-3">
              Scan this QR code with <strong>Google Authenticator</strong>, <strong>Authy</strong>,
              or any TOTP app.
            </p>
            {qrCodeUrl && (
              <img src={qrCodeUrl} alt="MFA QR Code" className="mx-auto w-44 h-44 rounded-lg" />
            )}
            <p className="text-xs text-dark-400 mt-2 font-mono break-all">{secret}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-dark-700 dark:text-dark-300 mb-1">
              Enter 6-digit code to confirm
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
              placeholder="000000"
              className="w-full px-4 py-2.5 bg-white dark:bg-dark-800 border border-dark-300 dark:border-dark-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 tracking-widest text-center text-dark-900 dark:text-white"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={confirmSetup} loading={loading} variant="primary" size="sm">
              Confirm & Enable
            </Button>
            <Button
              onClick={() => {
                setStep('idle');
                setToken('');
              }}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Disable step */}
      {step === 'disable' && (
        <div className="space-y-4">
          <p className="text-sm text-dark-600 dark:text-dark-300">
            Enter your current authenticator code to disable MFA.
          </p>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full px-4 py-2.5 bg-white dark:bg-dark-800 border border-red-400 dark:border-red-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 tracking-widest text-center text-dark-900 dark:text-white"
          />
          <div className="flex gap-2">
            <Button onClick={confirmDisable} loading={loading} variant="danger" size="sm">
              Disable MFA
            </Button>
            <Button
              onClick={() => {
                setStep('idle');
                setToken('');
              }}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
