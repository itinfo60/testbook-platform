import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HiDownload, HiExternalLink } from 'react-icons/hi';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { fetchMyEnrollments } from '@/features/enrollment/enrollmentSlice';
import { enrollmentAPI } from '@/services/api';
import toast from 'react-hot-toast';

export default function AchievementsPage() {
  const dispatch = useDispatch();
  const { enrollments, loading } = useSelector((state) => state.enrollments);
  const [claiming, setClaiming] = useState({});

  useEffect(() => {
    dispatch(fetchMyEnrollments());
  }, [dispatch]);

  const completedEnrollments = enrollments.filter(
    (e) => e.status === 'completed' || (e.progressPercentage ?? e.progress ?? 0) >= 100
  );

  const handleDownload = async (courseId, courseTitle) => {
    setClaiming((prev) => ({ ...prev, [courseId]: true }));
    try {
      const { data } = await enrollmentAPI.getCertificate(courseId);
      const url = data?.data?.certificateUrl || data?.certificateUrl;
      if (url) {
        window.open(url, '_blank');
        toast.success(`Certificate for "${courseTitle}" ready!`);
      } else {
        toast.error('Certificate URL not returned');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate certificate');
    } finally {
      setClaiming((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="section-title">🏅 Achievements</h1>
        <p className="section-subtitle">Download certificates for courses you've fully completed</p>
        {completedEnrollments.length > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 px-4 py-2 rounded-full text-sm font-medium">
            {completedEnrollments.length}{' '}
            {completedEnrollments.length === 1 ? 'certificate' : 'certificates'} earned
          </div>
        )}
      </div>

      {completedEnrollments.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-6xl mb-4">🎓</div>
          <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-2">
            No certificates yet
          </h2>
          <p className="text-dark-400 text-sm">
            Complete 100% of a course to earn your certificate
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {completedEnrollments.map((enrollment) => {
            const course = enrollment.course || {};
            const isClaiming = claiming[course._id];
            const hasCert = !!enrollment.certificateUrl;

            return (
              <div
                key={enrollment._id}
                className="card p-5 flex flex-col gap-4 ring-2 ring-green-200 dark:ring-green-800 bg-green-50/30 dark:bg-green-950/10"
              >
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl flex-shrink-0">
                    🎓
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-dark-900 dark:text-white text-sm line-clamp-2">
                      {course.title || 'Course'}
                    </h3>
                    <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">
                      ✓ Completed
                      {enrollment.completedAt &&
                        ` · ${new Date(enrollment.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(course._id, course.title)}
                    disabled={isClaiming}
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium transition-colors"
                  >
                    <HiDownload className="h-4 w-4 flex-shrink-0" />
                    {isClaiming
                      ? 'Generating…'
                      : hasCert
                        ? 'Download Again'
                        : 'Download Certificate'}
                  </button>
                  {hasCert && (
                    <a
                      href={enrollment.certificateUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg border border-dark-200 dark:border-dark-700 hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-500 transition-colors"
                      title="Open certificate"
                    >
                      <HiExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
