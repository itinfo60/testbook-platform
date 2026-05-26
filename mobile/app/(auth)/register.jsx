import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch, useSelector } from 'react-redux';
import { register, clearError } from '../../src/store/authSlice';

export default function RegisterScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });

  const set = (key) => (val) => {
    setForm((f) => ({ ...f, [key]: val }));
    dispatch(clearError());
  };

  const handleRegister = async () => {
    const result = await dispatch(register(form));
    if (register.fulfilled.match(result)) {
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoArea}>
          <Text style={styles.logoText}>📚</Text>
          <Text style={styles.brand}>Create Account</Text>
        </View>

        <View style={styles.card}>
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {[
            { key: 'name', label: 'Full Name', placeholder: 'John Doe' },
            {
              key: 'email',
              label: 'Email',
              placeholder: 'you@example.com',
              keyboardType: 'email-address',
            },
            {
              key: 'phone',
              label: 'Phone',
              placeholder: '+91 9876543210',
              keyboardType: 'phone-pad',
            },
            { key: 'password', label: 'Password', placeholder: '••••••••', secure: true },
          ].map(({ key, label, placeholder, keyboardType, secure }) => (
            <View key={key}>
              <Text style={styles.label}>{label}</Text>
              <TextInput
                style={styles.input}
                placeholder={placeholder}
                value={form[key]}
                onChangeText={set(key)}
                keyboardType={keyboardType || 'default'}
                secureTextEntry={!!secure}
                autoCapitalize={key === 'name' ? 'words' : 'none'}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          ))}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.btnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.linkRow}>
            <Text style={styles.linkText}>
              Already have an account? <Text style={styles.link}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#4F46E5', justifyContent: 'center', padding: 20 },
  logoArea: { alignItems: 'center', marginBottom: 24 },
  logoText: { fontSize: 48 },
  brand: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginTop: 8 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
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
  btn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 24,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 16 },
  linkRow: { alignItems: 'center', marginTop: 16 },
  linkText: { fontSize: 14, color: '#6B7280' },
  link: { color: '#4F46E5', fontWeight: '700' },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    marginBottom: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#EF4444',
  },
  errorText: { color: '#B91C1C', fontSize: 13 },
});
