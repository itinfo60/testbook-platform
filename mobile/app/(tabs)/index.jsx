import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { courseAPI, liveClassAPI } from '../../src/services/api';

export default function HomeScreen() {
  const router = useRouter();
  const [featured, setFeatured] = useState([]);
  const [liveClasses, setLiveClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      courseAPI.getFeatured().catch(() => ({ data: { data: { courses: [] } } })),
      liveClassAPI.getUpcoming().catch(() => ({ data: { data: { classes: [] } } })),
    ])
      .then(([coursesRes, classesRes]) => {
        setFeatured(coursesRes.data?.data?.courses?.slice(0, 4) || []);
        setLiveClasses(classesRes.data?.data?.classes?.slice(0, 3) || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Good morning! 👋</Text>
        <Text style={styles.subGreeting}>What do you want to learn today?</Text>
      </View>

      {/* Live Classes */}
      {liveClasses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔴 Live Now</Text>
          {liveClasses.map((cls) => (
            <TouchableOpacity
              key={cls._id}
              style={styles.liveCard}
              onPress={() => router.push(`/live/${cls._id}`)}
            >
              <View style={styles.liveDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.liveTitle}>{cls.title}</Text>
                <Text style={styles.liveTeacher}>{cls.teacher?.name}</Text>
              </View>
              <TouchableOpacity style={styles.joinBtn}>
                <Text style={styles.joinBtnText}>Join</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Featured Courses */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Featured Courses</Text>
          <TouchableOpacity onPress={() => router.push('/courses')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {featured.map((course) => (
            <TouchableOpacity
              key={course._id}
              style={styles.courseCard}
              onPress={() => router.push(`/course/${course._id}`)}
            >
              {course.thumbnail?.url ? (
                <Image source={{ uri: course.thumbnail.url }} style={styles.courseThumbnail} />
              ) : (
                <View style={[styles.courseThumbnail, styles.coursePlaceholder]}>
                  <Text style={{ fontSize: 32 }}>📘</Text>
                </View>
              )}
              <Text style={styles.courseTitle} numberOfLines={2}>
                {course.title}
              </Text>
              <Text style={styles.coursePrice}>
                {course.isFree ? 'Free' : `₹${course.effectivePrice}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {[
            { icon: '🤖', label: 'AI Doubt Solver', route: '/ai' },
            { icon: '📋', label: 'Take a Test', route: '/tests' },
            { icon: '🎓', label: 'My Courses', route: '/courses' },
            { icon: '🏆', label: 'Leaderboard', route: '/leaderboard' },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.quickCard}
              onPress={() => router.push(item.route)}
            >
              <Text style={styles.quickIcon}>{item.icon}</Text>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { backgroundColor: '#4F46E5', paddingTop: 60, paddingBottom: 24, paddingHorizontal: 20 },
  greeting: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  subGreeting: { fontSize: 14, color: '#C7D2FE', marginTop: 4 },
  section: { padding: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 12 },
  seeAll: { fontSize: 14, color: '#4F46E5', fontWeight: '600' },
  liveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  liveDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', marginRight: 12 },
  liveTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  liveTeacher: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  joinBtn: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  joinBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  courseCard: {
    width: 180,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  courseThumbnail: { width: '100%', height: 100 },
  coursePlaceholder: { backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  courseTitle: { fontSize: 13, fontWeight: '600', color: '#1F2937', padding: 10, paddingBottom: 4 },
  coursePrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: {
    width: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickIcon: { fontSize: 28, marginBottom: 8 },
  quickLabel: { fontSize: 13, fontWeight: '600', color: '#374151', textAlign: 'center' },
});
