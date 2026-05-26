import { useState, useCallback, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_CREDENTIALS_KEY = 'biometric_credentials';

/**
 * Provides biometric authentication (fingerprint / Face ID) for quick re-login.
 * Credentials are stored in SecureStore (hardware-backed keychain/keystore).
 */
export function useBiometricAuth() {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState(null);

  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsSupported(compatible && enrolled);

      if (compatible && enrolled) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Fingerprint');
        } else {
          setBiometricType('Biometric');
        }
      }

      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      setIsEnabled(enabled === 'true');
    })();
  }, []);

  const enableBiometric = useCallback(
    async (email, password) => {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Enable ${biometricType || 'biometric'} login`,
        fallbackLabel: 'Use passcode',
      });

      if (!result.success) return false;

      await SecureStore.setItemAsync(
        BIOMETRIC_CREDENTIALS_KEY,
        JSON.stringify({ email, password })
      );
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
      setIsEnabled(true);
      return true;
    },
    [biometricType]
  );

  const disableBiometric = useCallback(async () => {
    await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'false');
    setIsEnabled(false);
  }, []);

  const authenticateWithBiometric = useCallback(async () => {
    if (!isSupported || !isEnabled) return null;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Sign in with ${biometricType || 'biometric'}`,
      fallbackLabel: 'Use password',
      cancelLabel: 'Cancel',
    });

    if (!result.success) return null;

    const raw = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
    if (!raw) return null;

    return JSON.parse(raw); // returns { email, password }
  }, [isSupported, isEnabled, biometricType]);

  return {
    isSupported,
    isEnabled,
    biometricType,
    enableBiometric,
    disableBiometric,
    authenticateWithBiometric,
  };
}
