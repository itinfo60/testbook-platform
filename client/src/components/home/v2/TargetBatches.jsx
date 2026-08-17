import { Link } from 'react-router-dom';
import { HiArrowRight, HiBookOpen, HiClipboardList } from 'react-icons/hi';
import { useSelector } from 'react-redux';

export default function TargetBatches() {
  // Pull featured/published courses from Redux store (populated by CuratedCourses or similar)
  const { list: courses } = useSelector((s) => s.courses || { list: [] });

  // Show up to 4 courses; if none yet, show nothing rather than fake data
  const displayed = (courses || []).filter((c) => c.isPublished !== false).slice(0, 4);

  if (displayed.length === 0) return null;

  return (
    <section className="py-24 bg-white relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-navy-200 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-navy-900 mb-4 tracking-tight">
            Don't Study Alone. Study With a System.
          </h2>
          <p className="text-lg text-navy-600">
            Live classes, structured notes, practice tests and faculty guidance — organized around
            your exam timeline.
          </p>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-6">
          {displayed.map((course, idx) => {
            const isPopular = course.isFeatured || idx === 0;
            const price = course.price > 0 ? `₹${course.price.toLocaleString('en-IN')}` : 'Free';
            const oldPrice =
              course.salePrice && course.salePrice < course.price
                ? `₹${course.price.toLocaleString('en-IN')}`
                : null;
            const displayPrice =
              course.salePrice && course.salePrice < course.price
                ? `₹${course.salePrice.toLocaleString('en-IN')}`
                : price;

            return (
              <div
                key={course._id}
                className={`bg-white rounded-2xl border ${
                  isPopular
                    ? 'border-accent-400 shadow-xl shadow-accent-500/10 relative'
                    : 'border-navy-100 shadow-lg shadow-navy-900/5'
                } overflow-hidden flex flex-col`}
              >
                {isPopular && (
                  <div className="bg-accent-500 text-white text-xs font-bold uppercase tracking-wider py-1.5 px-4 text-center">
                    Featured
                  </div>
                )}

                {course.thumbnail?.url && (
                  <img
                    src={course.thumbnail.url}
                    alt={course.title}
                    className="w-full h-36 object-cover"
                  />
                )}

                <div className="p-6 flex flex-col flex-grow">
                  {course.examCategory?.name && (
                    <span className="text-xs font-bold text-navy-500 uppercase tracking-wider mb-3 block">
                      {course.examCategory.name}
                    </span>
                  )}
                  <h3 className="text-base font-bold text-navy-900 leading-tight mb-3">
                    {course.title}
                  </h3>

                  {course.shortDescription && (
                    <p className="text-xs text-navy-600 line-clamp-2 mb-4">
                      {course.shortDescription}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-navy-500 mb-4">
                    {course.totalLessons > 0 && (
                      <span className="flex items-center gap-1">
                        <HiBookOpen className="h-4 w-4" /> {course.totalLessons} lessons
                      </span>
                    )}
                    {course.enrollmentCount > 0 && (
                      <span className="flex items-center gap-1">
                        <HiClipboardList className="h-4 w-4" /> {course.enrollmentCount}+ enrolled
                      </span>
                    )}
                  </div>

                  <div className="mt-auto">
                    <div className="flex items-end gap-2 mb-4">
                      <span className="text-2xl font-bold text-navy-900">{displayPrice}</span>
                      {oldPrice && (
                        <span className="text-sm text-navy-400 line-through mb-1">{oldPrice}</span>
                      )}
                    </div>

                    <Link
                      to={`/courses/${course.slug || course._id}`}
                      className={`block w-full text-center py-3 rounded-xl font-semibold transition-all ${
                        isPopular
                          ? 'bg-accent-500 text-white hover:bg-accent-600'
                          : 'bg-navy-900 text-white hover:bg-navy-800'
                      }`}
                    >
                      Enroll Now <HiArrowRight className="inline h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <Link
            to="/courses"
            className="inline-flex items-center gap-2 px-6 py-3 bg-navy-50 hover:bg-navy-100 text-navy-900 rounded-full font-bold text-sm transition-all"
          >
            Browse All Courses <HiArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
