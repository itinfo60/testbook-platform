import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HiBookOpen, HiClipboardList, HiUsers, HiCurrencyRupee } from 'react-icons/hi';
import { fetchTeacherCourses } from '@/features/course/courseSlice';
import { fetchTeacherTests } from '@/features/test/testSlice';

export default function TeacherDashboard() {
  const dispatch = useDispatch();
  const { teacherCourses } = useSelector(state => state.courses);
  const { teacherTests } = useSelector(state => state.tests);

  useEffect(() => {
    dispatch(fetchTeacherCourses());
    dispatch(fetchTeacherTests());
  }, [dispatch]);

  const stats = [
    { icon: HiBookOpen, label: 'Total Courses', value: teacherCourses.length, color: 'text-primary-600 bg-primary-50 dark:bg-primary-900/30' },
    { icon: HiClipboardList, label: 'Total Tests', value: teacherTests.length, color: 'text-accent-600 bg-accent-50 dark:bg-accent-900/30' },
    { icon: HiUsers, label: 'Total Students', value: teacherCourses.reduce((sum, c) => sum + (c.studentsEnrolled || 0), 0), color: 'text-secondary-600 bg-secondary-50 dark:bg-secondary-900/30' },
    { icon: HiCurrencyRupee, label: 'Total Revenue', value: `₹${teacherCourses.reduce((sum, c) => sum + (c.revenue || 0), 0).toLocaleString()}`, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30' },
  ];

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="card p-5">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="text-2xl font-bold text-dark-900 dark:text-white">{stat.value}</div>
            <div className="text-sm text-dark-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Courses */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-dark-900 dark:text-white mb-4">Recent Courses</h2>
        {teacherCourses.length === 0 ? (
          <p className="text-dark-500 text-center py-6">No courses created yet</p>
        ) : (
          <div className="space-y-3">
            {teacherCourses.slice(0, 5).map(course => (
              <div key={course._id} className="flex items-center gap-4 p-3 bg-dark-50 dark:bg-dark-800/50 rounded-xl">
                <div className="h-10 w-16 rounded-lg bg-dark-200 dark:bg-dark-700 flex-shrink-0 overflow-hidden">
                  {course.thumbnail ? (
                    <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">📘</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-dark-900 dark:text-white truncate">{course.title}</p>
                  <p className="text-xs text-dark-400">{course.studentsEnrolled || 0} students</p>
                </div>
                <span className={`badge ${course.isPublished ? 'badge-success' : 'badge-warning'}`}>
                  {course.isPublished ? 'Published' : 'Draft'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
