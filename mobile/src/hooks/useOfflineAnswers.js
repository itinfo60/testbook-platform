import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { api } from '../services/api';

const OFFLINE_ANSWERS_KEY = (testId) => `offline_answers_${testId}`;

/**
 * Persists quiz answers to AsyncStorage so they survive app kills while offline.
 * Syncs to the server automatically when connectivity is restored.
 */
export function useOfflineAnswers(testId) {
  const [answers, setAnswers] = useState({});
  const [syncing, setSyncing] = useState(false);

  const saveAnswer = useCallback(
    async (questionId, answerId) => {
      const updated = { ...answers, [questionId]: answerId };
      setAnswers(updated);
      try {
        await AsyncStorage.setItem(
          OFFLINE_ANSWERS_KEY(testId),
          JSON.stringify({ testId, answers: updated, savedAt: Date.now() })
        );
      } catch (err) {
        console.warn('Could not persist answer offline:', err.message);
      }
    },
    [answers, testId]
  );

  const loadSavedAnswers = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(OFFLINE_ANSWERS_KEY(testId));
      if (!raw) return {};
      const { answers: saved } = JSON.parse(raw);
      setAnswers(saved || {});
      return saved || {};
    } catch {
      return {};
    }
  }, [testId]);

  const clearSavedAnswers = useCallback(async () => {
    setAnswers({});
    try {
      await AsyncStorage.removeItem(OFFLINE_ANSWERS_KEY(testId));
    } catch {}
  }, [testId]);

  const syncOfflineAnswers = useCallback(
    async (submissionId) => {
      const { isConnected } = await NetInfo.fetch();
      if (!isConnected) return false;

      const raw = await AsyncStorage.getItem(OFFLINE_ANSWERS_KEY(testId));
      if (!raw) return false;

      const { answers: offlineAnswers } = JSON.parse(raw);
      if (!offlineAnswers || Object.keys(offlineAnswers).length === 0) return false;

      setSyncing(true);
      try {
        await api.patch(`/tests/${testId}/submissions/${submissionId}/sync`, {
          answers: offlineAnswers,
        });
        await clearSavedAnswers();
        return true;
      } catch (err) {
        console.warn('Sync failed, will retry on next connection:', err.message);
        return false;
      } finally {
        setSyncing(false);
      }
    },
    [testId, clearSavedAnswers]
  );

  return { answers, saveAnswer, loadSavedAnswers, clearSavedAnswers, syncOfflineAnswers, syncing };
}
