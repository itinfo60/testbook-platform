import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HiPlus, HiEye, HiPencil, HiUpload } from 'react-icons/hi';
import { fetchTeacherCourses, publishCourse } from '@/features/course/courseSlice';
import toast from 'react-hot-toast';

export default function TeacherCourses() {
  const dispatch = useDispatch();
  const { teacherCourses, loading } = useSelector((state) => state.courses);
  const [publishing, setPublishing] = useState({});

  const handlePublish = async (courseId) => {
    setPublishing((p) => ({ ...p, [courseId]: true }));
    try {
      await dispatch(publishCourse(courseId)).unwrap();
      toast.success('Course published!');
    } catch (err) {
      toast.error(err || 'Failed to publish');
    } finally {
      setPublishing((p) => ({ ...p, [courseId]: false }));
    }
  };

  useEffect(() => {
    dispatch(fetchTeacherCourses());
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-8 pb-4 border-b border-slate-100 dark:border-dark-700">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Courses
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage and publish your educational content
          </p>
        </div>
        <Link
          to="/teacher/courses/new"
          className="group relative inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-2.5 text-sm font-semibold text-white transition-all duration-200 bg-primary-600 font-pj rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-500/30 hover:-translate-y-0.5 whitespace-nowrap"
        >
          <HiPlus className="mr-1.5 h-4 w-4" /> Create Course
        </Link>
      </div>

      {teacherCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 shadow-sm">
          <div className="h-24 w-24 rounded-full bg-slate-50 dark:bg-dark-700 flex items-center justify-center mb-6">
            <span className="text-6xl">📖</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No courses yet</h3>
          <p className="text-slate-500 max-w-md mb-6">
            Create your first course to start teaching and sharing your knowledge.
          </p>
          <Link to="/teacher/courses/new" className="btn-primary inline-flex items-center gap-2">
            <HiPlus className="h-4 w-4" /> Create Your First Course
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teacherCourses.map((course, idx) => (
            <div
              key={course._id}
              className="group flex flex-col rounded-2xl bg-white dark:bg-dark-800 border border-slate-100 dark:border-dark-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              <div className="h-48 w-full bg-slate-100 dark:bg-dark-900 relative overflow-hidden">
                {course.thumbnail?.url || course.thumbnail ? (
                  <img
                    src={course.thumbnail?.url || course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary-500/20 to-primary-700/20 dark:from-primary-900/40 dark:to-primary-800/40">
                    <span className="text-4xl mb-2">📘</span>
                    <span className="text-xs font-medium text-primary-600 dark:text-primary-400">
                      No Cover Image
                    </span>
                  </div>
                )}

                {/* Status Badge overlay */}
                <div className="absolute top-4 right-4">
                  <span
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl shadow-sm backdrop-blur-md ${course.isPublished ? 'bg-emerald-500/90 text-white' : 'bg-amber-500/90 text-white'}`}
                  >
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>

                {/* Quick actions overlay */}
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 backdrop-blur-sm">
                  <Link
                    to={`/courses/${course._id}`}
                    className="h-10 w-10 rounded-full bg-white text-slate-800 hover:bg-primary-500 hover:text-white flex items-center justify-center transition-colors shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75"
                    title="View Course Page"
                  >
                    <HiEye className="h-5 w-5" />
                  </Link>
                  <Link
                    to={`/teacher/courses/${course._id}/edit`}
                    className="h-10 w-10 rounded-full bg-white text-slate-800 hover:bg-primary-500 hover:text-white flex items-center justify-center transition-colors shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-150"
                    title="Edit Course"
                  >
                    <HiPencil className="h-5 w-5" />
                  </Link>
                  {!course.isPublished && (
                    <button
                      onClick={() => handlePublish(course._id)}
                      disabled={publishing[course._id]}
                      className="h-10 w-10 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 flex items-center justify-center transition-colors shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-200"
                      title="Publish Course"
                    >
                      {publishing[course._id] ? (
                        <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      ) : (
                        <HiUpload className="h-5 w-5" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {course.title}
                  </h3>
                </div>

                <div className="mt-5 flex items-center justify-between text-sm border-t border-slate-50 dark:border-dark-700/50 pt-4">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
                      Lessons
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold mt-0.5">
                      {course.totalLessons || 0}
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-200 dark:bg-dark-700"></div>
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold">
                      Students
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-bold mt-0.5">
                      {course.enrollmentCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
