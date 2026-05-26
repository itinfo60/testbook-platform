import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { testAPI } from '../../src/services/api';

export default function TestAttemptScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [test, setTest] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    testAPI
      .getById(id)
      .then(({ data }) => {
        const t = data?.data?.test;
        setTest(t);
        setTimeLeft((t?.duration || 30) * 60);
      })
      .catch(() => Alert.alert('Error', 'Test not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const startTest = async () => {
    try {
      const { data } = await testAPI.start(id);
      setAttempt(data?.data?.attempt);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current);
            handleSubmit(true);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Cannot start test');
    }
  };

  const handleSubmit = async (auto = false) => {
    if (!auto) {
      const unanswered = test.questions?.length - Object.keys(answers).length;
      if (unanswered > 0) {
        Alert.alert('Submit Test?', `You have ${unanswered} unanswered question(s).`, [
          { text: 'Review', style: 'cancel' },
          { text: 'Submit', style: 'destructive', onPress: () => doSubmit() },
        ]);
        return;
      }
    }
    doSubmit();
  };

  const doSubmit = async () => {
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const formatted = Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption,
      }));
      const { data } = await testAPI.submit(attempt._id, { answers: formatted });
      setResult(data?.data);
    } catch {
      Alert.alert('Error', 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  if (!test)
    return (
      <View style={styles.center}>
        <Text>Test not found</Text>
      </View>
    );

  if (result) {
    const pct = Math.round((result.score / result.totalMarks) * 100);
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.resultContainer}>
        <View style={styles.resultCard}>
          <Text style={styles.resultEmoji}>{pct >= 60 ? '🎉' : '📚'}</Text>
          <Text style={styles.resultTitle}>{pct >= 60 ? 'Well Done!' : 'Keep Practicing!'}</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNum}>{pct}%</Text>
            <Text style={styles.scoreLabel}>Score</Text>
          </View>
          <View style={styles.resultStats}>
            <View style={styles.rStat}>
              <Text style={styles.rStatVal}>{result.score}</Text>
              <Text style={styles.rStatLbl}>Marks</Text>
            </View>
            <View style={styles.rStat}>
              <Text style={[styles.rStatVal, { color: '#16A34A' }]}>{result.correct}</Text>
              <Text style={styles.rStatLbl}>Correct</Text>
            </View>
            <View style={styles.rStat}>
              <Text style={[styles.rStatVal, { color: '#DC2626' }]}>{result.wrong}</Text>
              <Text style={styles.rStatLbl}>Wrong</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.replace('/tests')}>
            <Text style={styles.doneBtnText}>Back to Tests</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  if (!attempt) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.startContainer}>
        <View style={styles.startCard}>
          <Text style={styles.startEmoji}>📋</Text>
          <Text style={styles.testTitle}>{test.title}</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoVal}>{test.questions?.length || 0}</Text>
              <Text style={styles.infoLbl}>Questions</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoVal}>{test.duration}</Text>
              <Text style={styles.infoLbl}>Minutes</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoVal}>{test.totalMarks || test.questions?.length}</Text>
              <Text style={styles.infoLbl}>Marks</Text>
            </View>
          </View>
          <Text style={styles.instructions}>
            Attempt all questions carefully. Each correct answer carries marks. You cannot go back
            after submitting.
          </Text>
          <TouchableOpacity style={styles.startBtn} onPress={startTest}>
            <Text style={styles.startBtnText}>Start Test</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const questions = test.questions || [];
  const q = questions[current];

  return (
    <View style={styles.container}>
      <View style={styles.questionHeader}>
        <Text style={styles.qProgress}>
          {current + 1} / {questions.length}
        </Text>
        <View style={[styles.timer, timeLeft < 60 && styles.timerWarning]}>
          <Text style={[styles.timerText, timeLeft < 60 && styles.timerTextWarning]}>
            {formatTime(timeLeft)}
          </Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View
          style={[styles.progressFill, { width: `${((current + 1) / questions.length) * 100}%` }]}
        />
      </View>

      <ScrollView style={styles.qBody} contentContainerStyle={{ padding: 20 }}>
        <Text style={styles.qText}>{q?.question}</Text>
        {q?.options?.map((opt, i) => {
          const selected = answers[q._id] === opt;
          return (
            <TouchableOpacity
              key={i}
              style={[styles.option, selected && styles.optionSelected]}
              onPress={() => setAnswers((a) => ({ ...a, [q._id]: opt }))}
            >
              <View style={[styles.optCircle, selected && styles.optCircleSelected]}>
                <Text style={[styles.optLetter, selected && styles.optLetterSelected]}>
                  {String.fromCharCode(65 + i)}
                </Text>
              </View>
              <Text style={[styles.optText, selected && styles.optTextSelected]}>{opt}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, current === 0 && styles.navBtnDisabled]}
          onPress={() => setCurrent((c) => c - 1)}
          disabled={current === 0}
        >
          <Text style={styles.navBtnText}>Prev</Text>
        </TouchableOpacity>
        {current < questions.length - 1 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={() => setCurrent((c) => c + 1)}>
            <Text style={styles.nextBtnText}>Next</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, styles.submitBtn]}
            onPress={() => handleSubmit()}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.nextBtnText}>Submit</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  startContainer: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  startCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  startEmoji: { fontSize: 56, marginBottom: 12 },
  testTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  infoGrid: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  infoItem: {
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 14,
    minWidth: 80,
  },
  infoVal: { fontSize: 22, fontWeight: '800', color: '#4F46E5' },
  infoLbl: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  instructions: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  startBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingHorizontal: 40,
    paddingVertical: 15,
  },
  startBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  qProgress: { fontSize: 14, fontWeight: '700', color: '#6B7280' },
  timer: {
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  timerWarning: { backgroundColor: '#FEE2E2' },
  timerText: { fontSize: 16, fontWeight: '800', color: '#4F46E5' },
  timerTextWarning: { color: '#DC2626' },
  progressBar: { height: 4, backgroundColor: '#E5E7EB', marginHorizontal: 20, borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: '#4F46E5', borderRadius: 2 },
  qBody: { flex: 1 },
  qText: { fontSize: 16, fontWeight: '600', color: '#1F2937', lineHeight: 24, marginBottom: 20 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionSelected: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  optCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optCircleSelected: { borderColor: '#4F46E5', backgroundColor: '#4F46E5' },
  optLetter: { fontSize: 13, fontWeight: '700', color: '#6B7280' },
  optLetterSelected: { color: '#FFFFFF' },
  optText: { fontSize: 14, color: '#374151', flex: 1, lineHeight: 20 },
  optTextSelected: { color: '#1F2937', fontWeight: '600' },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  navBtn: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  nextBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  submitBtn: { backgroundColor: '#059669' },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  resultContainer: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  resultEmoji: { fontSize: 56, marginBottom: 8 },
  resultTitle: { fontSize: 22, fontWeight: '800', color: '#1F2937', marginBottom: 20 },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EEF2FF',
    borderWidth: 6,
    borderColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  scoreNum: { fontSize: 28, fontWeight: '800', color: '#4F46E5' },
  scoreLabel: { fontSize: 12, color: '#6B7280' },
  resultStats: { flexDirection: 'row', gap: 16, marginBottom: 28 },
  rStat: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    minWidth: 80,
  },
  rStatVal: { fontSize: 22, fontWeight: '800', color: '#1F2937' },
  rStatLbl: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  doneBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingHorizontal: 40,
    paddingVertical: 14,
  },
  doneBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
