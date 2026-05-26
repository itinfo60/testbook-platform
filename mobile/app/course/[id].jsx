import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { courseAPI, enrollmentAPI } from '../../src/services/api';
import { useSelector } from 'react-redux';

export default function CourseDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useSelector((s) => s.auth);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    courseAPI
      .getById(id)
      .then(({ data }) => setCourse(data?.data?.course))
      .catch(() => Alert.alert('Error', 'Course not found'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    setEnrolling(true);
    try {
      await enrollmentAPI.enroll(id);
      Alert.alert('Enrolled!', 'You are now enrolled in this course.', [
        { text: 'Start Learning', onPress: () => {} },
      ]);
      const { data } = await courseAPI.getById(id);
      setCourse(data?.data?.course);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not enroll');
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  if (!course) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Course not found</Text>
      </View>
    );
  }

  const totalLessons = course.sections?.reduce((acc, s) => acc + (s.lessons?.length || 0), 0) || 0;

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {course.thumbnail?.url ? (
          <Image source={{ uri: course.thumbnail.url }} style={styles.banner} />
        ) : (
          <View style={[styles.banner, styles.bannerPlaceholder]}>
            <Text style={{ fontSize: 64 }}>📘</Text>
          </View>
        )}

        <View style={styles.body}>
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.teacher}>by {course.teacher?.name || 'Instructor'}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="book" size={14} color="#6B7280" />
              <Text style={styles.statText}>{totalLessons} lessons</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="people" size={14} color="#6B7280" />
              <Text style={styles.statText}>{course.enrollmentCount || 0} students</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.statText}>{course.rating?.average?.toFixed(1) || '—'}</Text>
            </View>
          </View>

          {course.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this course</Text>
              <Text style={styles.description}>{course.description}</Text>
            </View>
          )}

          {course.sections?.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Course Content</Text>
              {course.sections.map((sec, i) => (
                <View key={sec._id || i} style={styles.sectionBlock}>
                  <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => setExpanded(expanded === i ? null : i)}
                  >
                    <Text style={styles.sectionName}>{sec.title}</Text>
                    <View style={styles.row}>
                      <Text style={styles.lessonCount}>{sec.lessons?.length || 0} lessons</Text>
                      <Ionicons
                        name={expanded === i ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#6B7280"
                      />
                    </View>
                  </TouchableOpacity>
                  {expanded === i &&
                    sec.lessons?.map((lesson, j) => (
                      <View key={lesson._id || j} style={styles.lessonRow}>
                        <Ionicons
                          name={lesson.dripLocked ? 'lock-closed' : 'play-circle'}
                          size={16}
                          color={lesson.dripLocked ? '#D1D5DB' : '#4F46E5'}
                        />
                        <Text style={[styles.lessonTitle, lesson.dripLocked && styles.lockedText]}>
                          {lesson.title}
                          {lesson.dripLocked ? ' (unlocks in ' + lesson.dripDays + 'd)' : ''}
                        </Text>
                      </View>
                    ))}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.price}>{course.isFree ? 'Free' : `₹${course.effectivePrice}`}</Text>
        </View>
        <TouchableOpacity
          style={[styles.enrollBtn, enrolling && styles.btnDisabled]}
          onPress={handleEnroll}
          disabled={enrolling}
        >
          {enrolling ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.enrollText}>
              {course.isEnrolled ? 'Continue Learning' : course.isFree ? 'Enroll Free' : 'Buy Now'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: '#6B7280', fontSize: 16 },
  banner: { width: '100%', height: 220 },
  bannerPlaceholder: { backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', color: '#1F2937', marginBottom: 6 },
  teacher: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 13, color: '#6B7280' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1F2937', marginBottom: 10 },
  description: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
  sectionBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  sectionName: { fontSize: 14, fontWeight: '700', color: '#1F2937', flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lessonCount: { fontSize: 12, color: '#6B7280' },
  lessonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  lessonTitle: { fontSize: 13, color: '#374151', flex: 1 },
  lockedText: { color: '#9CA3AF' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  priceLabel: { fontSize: 12, color: '#6B7280' },
  price: { fontSize: 22, fontWeight: '800', color: '#4F46E5' },
  enrollBtn: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingHorizontal: 28,
    paddingVertical: 14,
  },
  btnDisabled: { opacity: 0.6 },
  enrollText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
});
