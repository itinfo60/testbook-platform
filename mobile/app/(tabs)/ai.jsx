import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { aiAPI } from '../../src/services/api';

export default function AITutorScreen() {
  const [question, setQuestion] = useState('');
  const [subject, setSubject] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const solve = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setAnswer('');
    try {
      const { data } = await aiAPI.solveDoubt({ question, subject });
      setAnswer(data.data?.answer || '');
    } catch (err) {
      setAnswer('Failed to get answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🤖 AI Doubt Solver</Text>
        <Text style={styles.headerSub}>Powered by GPT-4o — ask anything</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Subject (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Physics, Chemistry"
          value={subject}
          onChangeText={setSubject}
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Your Question</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Type your doubt here..."
          value={question}
          onChangeText={setQuestion}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          placeholderTextColor="#9CA3AF"
        />

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={solve}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.btnText}>Solve My Doubt</Text>
          )}
        </TouchableOpacity>
      </View>

      {!!answer && (
        <View style={styles.answerCard}>
          <Text style={styles.answerLabel}>Answer</Text>
          <Text style={styles.answerText}>{answer}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#7C3AED', paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  headerSub: { fontSize: 14, color: '#DDD6FE', marginTop: 4 },
  card: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  textArea: { height: 120 },
  btn: {
    backgroundColor: '#7C3AED',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  answerCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  answerLabel: { fontSize: 14, fontWeight: '700', color: '#7C3AED', marginBottom: 8 },
  answerText: { fontSize: 14, color: '#374151', lineHeight: 22 },
});
