import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HiPlus } from 'react-icons/hi';
import { fetchTeacherCourses } from '@/features/course/courseSlice';

export default function TeacherCourses() {
  const dispatch = useDispatch();
  const { teacherCourses, loading } = useSelector(state => state.courses);

  useEffect(() => {
    dispatch(fetchTeacherCourses());
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-dark-900 dark:text-white">My Courses</h2>
        <Link to="/teacher/courses/new">
          <Button icon={HiPlus} size="sm">Create Course</Button>
        </Link>
      </div>

      {teacherCourses.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">📖</div>
          <h3 className="text-lg font-semibold text-dark-900 dark:text-white mb-2">No courses yet</h3>
          <p className="text-dark-500 mb-4">Create your first course to start teaching</p>
          <Link to="/teacher/courses/new" className="btn-primary inline-flex items-center gap-2">
            <HiPlus className="h-4 w-4" /> Create Course
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {teacherCourses.map(course => (
            <div key={course._id} className="card p-4 flex items-center gap-4">
              <div className="h-16 w-24 rounded-lg bg-dark-100 dark:bg-dark-700 flex-shrink-0 overflow-hidden">
                {course.thumbnail ? (
                  <img src={course.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 text-white text-xl">📘</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-dark-900 dark:text-white truncate">{course.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-dark-400">
                  <span>{course.lessons?.length || 0} lessons</span>
                  <span>{course.studentsEnrolled || 0} students</span>
                  <span className={`badge ${course.isPublished ? 'badge-success' : 'badge-warning'}`}>
                    {course.isPublished ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Link to={`/courses/${course._id}`} className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-400" title="View">
                  <HiEye className="h-4 w-4" />
                </Link>
                <Link to={`/teacher/courses/${course._id}/edit`} className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-800 text-dark-400" title="Edit">
                  <HiPencil className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
