import { useState, useEffect } from 'react';
import api from '@/services/api';
import { HiArrowRight } from 'react-icons/hi';
import CourseCard from '@/features/course/components/CourseCard';
import { Link } from 'react-router-dom';

export default function CuratedCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoursesData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/courses', { params: { limit: 4, isPublished: true } });
        const list = res.data?.data?.courses || res.data?.courses || res.data?.data || [];
        if (Array.isArray(list)) {
          setCourses(list.slice(0, 4));
        }
      } catch {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCoursesData();
  }, []);

  return (
    <section className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-accent-600 mb-2">
              Expert-Led Batches
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-extrabold text-navy-950 tracking-tight">
              Learn From the Right Course
            </h2>
            <p className="text-base sm:text-lg text-navy-600 mt-2">
              Structured courses built around the actual exam syllabus with live classes, study
              notes & doubt resolution.
            </p>
          </div>

          <Link
            to="/courses"
            className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-navy-950 hover:text-accent-600 transition-colors border-b-2 border-navy-200 hover:border-accent-600 pb-1 whitespace-nowrap self-start md:self-auto"
          >
            View All Courses <HiArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Courses Grid with exact CourseCard */}
        {!loading && courses.length === 0 ? (
          <div className="text-center py-12 bg-[#faf9f6] rounded-3xl border border-navy-100">
            <h3 className="text-xl font-bold text-navy-900">No courses available</h3>
            <p className="text-navy-600 mt-2">Check back later for new expert-led batches.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((course, idx) => (
              <div key={course._id || idx} className="flex">
                <CourseCard course={course} />
              </div>
            ))}
            {loading &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[400px] bg-slate-100 animate-pulse rounded-2xl"></div>
              ))}
          </div>
        )}

        {/* Bottom View All Button */}
        {!loading && (
          <div className="mt-12 text-center">
            <Link
              to="/courses"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white hover:bg-navy-50 text-navy-950 border border-navy-200 hover:border-navy-300 rounded-full font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all"
            >
              View All Courses <HiArrowRight className="h-4 w-4 text-accent-500" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
