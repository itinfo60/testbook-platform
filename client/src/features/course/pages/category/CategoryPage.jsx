import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchCourses } from '@/features/course/courseSlice';
import { useState } from 'react';

export default function CategoryPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { courses, loading, pagination } = useSelector(state => state.courses);
  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(fetchCourses({ category: id, page, limit: 12 }));
  }, [dispatch, id, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="section-title mb-2 capitalize">{id?.replace(/-/g, ' ')} Courses</h1>
      <p className="section-subtitle mb-8">Browse all courses in this category</p>

      <CourseGrid courses={courses} loading={loading} />
      <Pagination
        currentPage={pagination.page || page}
        totalPages={pagination.totalPages || 1}
        onPageChange={p => setPage(p)}
      />
    </div>
  );
}
