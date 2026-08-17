import { Link } from 'react-router-dom';
import { HiArrowRight, HiPlay, HiVideoCamera } from 'react-icons/hi';
import { useState, useEffect } from 'react';
import { courseAPI } from '@/services/api';

export default function FacultyShowcase() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await courseAPI.getFeatured();
        setCourses(res.data?.data?.slice(0, 3) || []);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  return (
    <section className="py-20 bg-navy-900 overflow-hidden relative">
      {/* Decorative blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent-500/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4 tracking-tight">
            See How CivicsEdu Teaches Before You Enroll.
          </h2>
          <p className="text-lg text-navy-300">
            No sales pitch. Watch the teaching quality yourself through our complete unedited free
            lectures.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {loading ? (
            Array(3)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="bg-navy-950 rounded-2xl overflow-hidden border border-navy-800 shadow-2xl animate-pulse"
                >
                  <div className="aspect-video bg-navy-800"></div>
                  <div className="p-6">
                    <div className="h-5 bg-navy-800 rounded w-full mb-2"></div>
                    <div className="h-5 bg-navy-800 rounded w-2/3 mb-4"></div>
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-navy-800">
                      <div className="h-10 w-10 rounded-full bg-navy-800"></div>
                      <div>
                        <div className="h-3 bg-navy-800 rounded w-20 mb-1.5"></div>
                        <div className="h-2 bg-navy-800 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
          ) : error || courses.length === 0 ? (
            <div className="col-span-3 text-center py-12">
              <p className="text-navy-300">No featured courses available at the moment.</p>
            </div>
          ) : (
            courses.map((course) => (
              <div
                key={course._id || course.id}
                className="group relative bg-navy-950 rounded-2xl overflow-hidden border border-navy-800 shadow-2xl transition-all hover:border-accent-500/50"
              >
                {/* Thumbnail Container */}
                <div className="relative aspect-video overflow-hidden bg-navy-800">
                  <img
                    src={
                      course.thumbnail?.url ||
                      course.thumbnail ||
                      'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                    }
                    alt={course.title || course.course}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity duration-300 mix-blend-overlay"
                  />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-16 w-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-accent-500 transition-all cursor-pointer">
                      <HiPlay className="h-8 w-8 text-white ml-1" />
                    </div>
                  </div>

                  {/* Free Preview Badge */}
                  <div className="absolute top-4 left-4 bg-accent-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <HiVideoCamera className="h-3 w-3" /> Free Preview
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-2">
                    {course.title || course.course}
                  </h3>
                  <div className="flex items-center gap-3 mt-4 pt-4 border-t border-navy-800">
                    <div className="h-10 w-10 rounded-full bg-navy-800 border border-navy-700 flex items-center justify-center text-navy-300 font-bold">
                      {(course.instructor?.name || course.faculty || 'F').charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {course.instructor?.name || course.faculty || 'Expert Faculty'}
                      </p>
                      <p className="text-xs text-navy-400">
                        {course.category?.name || course.subject || 'All Subjects'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/free-resources"
            className="inline-flex items-center gap-2 bg-navy-800 border border-navy-700 hover:bg-navy-700 text-white font-semibold px-8 py-3.5 rounded-lg transition-all shadow-lg"
          >
            View All Free Classes <HiArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
