import { useState, useEffect } from 'react';
import { enrollmentAPI } from '@/services/api';
import {
  HiAcademicCap,
  HiArrowRight,
  HiBookOpen,
  HiCheckCircle,
  HiClipboardList,
  HiOutlineSparkles,
  HiPlay,
  HiTrendingUp,
} from 'react-icons/hi';
import { Link } from 'react-router-dom';

export default function PerformancePreview() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await enrollmentAPI.getStudentAnalytics();
        if (res.data?.data?.analytics) {
          setAnalytics(res.data.data.analytics);
        }
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const totalCoursesEnrolled = analytics?.totalCoursesEnrolled || 0;
  const averageCourseProgress = analytics?.averageCourseProgress || 0;
  const averageTestScore = analytics?.averageTestScore || 0;
  const studyStreak = analytics?.studyStreak || 0;

  return (
    <section className="py-20 md:py-24 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Copy & Value Proposition */}
          <div className="lg:col-span-5">
            <div className="text-xs font-black uppercase tracking-widest text-accent-600 mb-2">
              Integrated Student Analytics
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-extrabold text-navy-950 tracking-tight mb-6 leading-tight">
              Turn Effort Into Progress
            </h2>
            <p className="text-base sm:text-lg text-navy-600 mb-8 leading-relaxed">
              Preparation without measurement is just guessing. Every video watched, practice quiz
              attempted, and full-length test submitted automatically updates your personal
              analytics cockpit.
            </p>

            <ul className="space-y-3.5 mb-10 text-sm font-semibold text-navy-800">
              <li className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <HiCheckCircle className="h-4 w-4" />
                </span>
                <span>Track course completion & lesson watch time automatically</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <HiCheckCircle className="h-4 w-4" />
                </span>
                <span>Real-time state percentile rank vs 25,000+ active aspirants</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <HiCheckCircle className="h-4 w-4" />
                </span>
                <span>Topic-wise accuracy diagnostics to eliminate weak areas</span>
              </li>
            </ul>

            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 bg-navy-950 hover:bg-navy-900 text-white rounded-2xl font-bold text-base shadow-xl hover:shadow-2xl transition-all"
            >
              Access Dashboard <HiArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Right Column: Authentic Dashboard Snapshot UI */}
          <div className="lg:col-span-7 relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-amber-500/10 via-blue-500/10 to-indigo-500/10 rounded-[40px] blur-2xl -z-10" />

            <div className="bg-[#faf9f6] rounded-[28px] border border-navy-100 shadow-2xl overflow-hidden">
              <div className="bg-white px-5 py-3.5 border-b border-navy-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-rose-400" />
                  <span className="w-3 h-3 rounded-full bg-amber-400" />
                  <span className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="ml-2 text-xs font-bold text-navy-400">
                    edurportal.in/dashboard
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {analytics ? 'Live Data' : 'Example Preview'}
                  </span>
                </div>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                {/* 1. Welcome Card */}
                <div className="bg-white p-5 rounded-2xl border border-navy-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-navy-950 font-display">
                      Welcome back 👋
                    </h3>
                    <p className="text-xs text-navy-500 font-medium">
                      Targeting: <span className="font-bold text-navy-900">RPSC RAS 2026</span> •
                      Streak:{' '}
                      <span className="text-amber-600 font-bold">
                        {studyStreak || 7} Days Active
                      </span>
                    </p>
                  </div>
                  <div className="bg-navy-50 px-3 py-1.5 rounded-xl text-xs font-bold text-navy-700 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    Overall Syllabus: {averageCourseProgress || 68}%
                  </div>
                </div>

                {/* 2. Top Live Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Enrolled Courses */}
                  <div className="bg-white p-3.5 rounded-2xl border border-navy-100 shadow-sm">
                    <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                      <HiBookOpen className="h-4 w-4" />
                    </div>
                    <div className="text-xl font-extrabold text-navy-950 font-display">
                      {totalCoursesEnrolled || 3} Batches
                    </div>
                    <div className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">
                      Courses
                    </div>
                  </div>

                  {/* Tests Taken */}
                  <div className="bg-white p-3.5 rounded-2xl border border-navy-100 shadow-sm">
                    <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                      <HiClipboardList className="h-4 w-4" />
                    </div>
                    <div className="text-xl font-extrabold text-navy-950 font-display">
                      42 Tests
                    </div>
                    <div className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">
                      Attempts
                    </div>
                  </div>

                  {/* Avg Score */}
                  <div className="bg-white p-3.5 rounded-2xl border border-navy-100 shadow-sm">
                    <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                      <HiTrendingUp className="h-4 w-4" />
                    </div>
                    <div className="text-xl font-extrabold text-emerald-600 font-display">
                      {averageTestScore || 84.2}%
                    </div>
                    <div className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">
                      Avg Accuracy
                    </div>
                  </div>

                  {/* Percentile Rank */}
                  <div className="bg-white p-3.5 rounded-2xl border border-navy-100 shadow-sm">
                    <div className="h-8 w-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-2">
                      <HiAcademicCap className="h-4 w-4" />
                    </div>
                    <div className="text-xl font-extrabold text-accent-600 font-display">
                      96.8 %ile
                    </div>
                    <div className="text-[10px] font-bold text-navy-400 uppercase tracking-wider">
                      State Rank #18
                    </div>
                  </div>
                </div>

                {/* 3. Continue Learning Item */}
                <div className="bg-white p-4 rounded-2xl border border-navy-100 shadow-sm">
                  <div className="flex items-center justify-between text-xs font-bold text-navy-400 uppercase tracking-wider mb-2">
                    <span>Continue Learning</span>
                    <span className="text-accent-600">68% Completed</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-navy-950 text-amber-400 flex items-center justify-center shrink-0">
                      <HiPlay className="h-5 w-5 ml-0.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-navy-950 truncate">
                        RAS Prelims 2026 Complete GS Crash Course
                      </div>
                      <div className="text-[11px] text-navy-500 font-medium truncate">
                        Next: Lesson 24 • Rajasthan Heritage & Art Architecture
                      </div>
                    </div>
                    <span className="px-3 py-1.5 bg-accent-500 text-navy-950 rounded-xl text-xs font-extrabold shrink-0">
                      Resume
                    </span>
                  </div>
                </div>

                {/* 4. Smart AI Diagnostic Recommendation */}
                <div className="bg-gradient-to-r from-navy-950 to-navy-900 text-white rounded-2xl p-4 shadow-md flex items-start gap-3">
                  <div className="h-8 w-8 rounded-xl bg-accent-500/20 text-accent-400 flex items-center justify-center shrink-0 mt-0.5">
                    <HiOutlineSparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-accent-400 uppercase tracking-wider mb-0.5">
                      Smart Topic Diagnostic
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      Strong in <strong>Rajasthan Geography (92%)</strong>. Your key improvement
                      area is <strong>State Polity & Local Government (64%)</strong>. 1 topic test
                      recommended today.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
