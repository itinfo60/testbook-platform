import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  HiArrowRight,
  HiBookOpen,
  HiClipboardList,
  HiCurrencyRupee,
  HiNewspaper,
  HiPuzzle,
  HiUsers,
} from 'react-icons/hi';
import { fetchTeacherCourses } from '@/features/course/courseSlice';
import { fetchTeacherTests } from '@/features/test/testSlice';
import { fetchTeacherQuizzes } from '@/features/quiz/quizSlice';
import { enrollmentAPI } from '@/services/api';

export default function TeacherDashboard() {
  const dispatch = useDispatch();
  const { teacherCourses } = useSelector((state) => state.courses);
  const { teacherTests } = useSelector((state) => state.tests);
  const { teacherQuizzes } = useSelector((state) => state.quizzes);
  const [uniqueStudentsCount, setUniqueStudentsCount] = useState(0);
  const [blogsCount, setBlogsCount] = useState(0);

  useEffect(() => {
    dispatch(fetchTeacherCourses());
    dispatch(fetchTeacherTests());
    dispatch(fetchTeacherQuizzes());

    // Fetch unique students
    enrollmentAPI
      .getTeacherStudents()
      .then((res) => {
        const students = res.data?.data?.students || [];
        const uniqueIds = new Set(students.map((s) => s.user?._id).filter(Boolean));
        setUniqueStudentsCount(uniqueIds.size);
      })
      .catch(() => setUniqueStudentsCount(0));

    // Fetch blogs count
    api
      .get('/blogs', { params: { limit: 100 } })
      .then((res) => {
        const list = res.data?.data?.blogs || res.data?.blogs || res.data?.data || [];
        setBlogsCount(Array.isArray(list) ? list.length : 0);
      })
      .catch(() => setBlogsCount(0));
  }, [dispatch]);

  const totalStudents = uniqueStudentsCount;

  const stats = [
    {
      icon: HiBookOpen,
      label: 'Total Courses',
      value: teacherCourses.length,
      color: 'from-blue-500 to-indigo-600',
      to: '/teacher/courses',
    },
    {
      icon: HiClipboardList,
      label: 'Total Tests',
      value: teacherTests.length,
      color: 'from-purple-500 to-pink-600',
      to: '/teacher/tests',
    },
    {
      icon: HiPuzzle,
      label: 'Total Quizzes',
      value: teacherQuizzes?.length || 0,
      color: 'from-rose-500 to-pink-500',
      to: '/teacher/quizzes',
    },
    {
      icon: HiUsers,
      label: 'Total Students',
      value: totalStudents,
      color: 'from-emerald-400 to-teal-500',
      to: '/teacher/students',
    },
    {
      icon: HiNewspaper,
      label: 'Blogs & Updates',
      value: blogsCount,
      color: 'from-amber-400 to-orange-500',
      to: '/teacher/blogs',
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 mb-10">
        {stats.map((stat, idx) => (
          <Link
            key={stat.label}
            to={stat.to}
            className="relative p-6 rounded-2xl bg-white dark:bg-dark-800 border border-slate-100 dark:border-dark-700 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group overflow-hidden"
            style={{ animationDelay: `${idx * 100}ms` }}
          >
            <div
              className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
            ></div>
            <div className="flex items-center justify-between mb-4">
              <div
                className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg text-white transform group-hover:scale-110 transition-transform duration-300`}
              >
                <stat.icon className="h-6 w-6" />
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-50 dark:bg-dark-700 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
                <HiArrowRight className="h-4 w-4 text-slate-600 dark:text-slate-400" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">
                {stat.value}
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                {stat.label}
              </div>
            </div>
            {/* Subtle glow effect behind card on hover */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-300 pointer-events-none`}
            ></div>
          </Link>
        ))}
      </div>
    </div>
  );
}
