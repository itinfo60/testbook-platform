import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  HiSearch,
  HiAcademicCap,
  HiClipboardList,
  HiDocumentText,
  HiNewspaper,
  HiChevronRight,
  HiOutlineDocumentText,
} from 'react-icons/hi';
import api from '@/services/api';
import CourseCard from '@/features/course/components/CourseCard';
import TestCard from '@/features/test/components/TestCard';
import LoadingSpinner from '@/components/common/LoadingSpinner';

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!query.trim()) return;

    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/search', { params: { q: query.trim() } });
        setResults(res.data?.data || res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to execute search');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-8 pb-20">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <HiSearch className="h-8 w-8 text-primary-600" />
            Search Results for{' '}
            <span className="text-primary-600 dark:text-primary-400">"{query}"</span>
          </h1>
          {results && (
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Found {results.totalResults || 0} matching items across exams, courses, tests,
              resources, and alerts.
            </p>
          )}
        </div>

        {loading && (
          <div className="py-20 text-center">
            <LoadingSpinner size="lg" />
            <p className="text-slate-500 mt-4">Searching across CivicsHub...</p>
          </div>
        )}

        {error && <div className="p-4 bg-red-50 text-red-700 rounded-xl text-center">{error}</div>}

        {!loading && results && results.totalResults === 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700">
            <HiSearch className="h-16 w-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
              No results found
            </h3>
            <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
              We couldn't find anything matching "{query}". Try searching for RAS, Patwari, RPSC,
              Political Science, or Syllabus.
            </p>
            <div className="flex justify-center gap-3">
              <Link to="/courses" className="btn-primary">
                Browse Courses
              </Link>
              <Link to="/exams" className="btn-outline">
                Browse Exams
              </Link>
            </div>
          </div>
        )}

        {!loading && results && results.totalResults > 0 && (
          <div className="space-y-12">
            {/* Exam Categories */}
            {results.exams && results.exams.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <HiAcademicCap className="h-6 w-6 text-primary-600" />
                  Exams ({results.exams.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.exams.map((exam) => (
                    <Link
                      key={exam.id || exam._id}
                      to={`/exams/${exam.slug}`}
                      className="group bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-primary-500 shadow-sm transition-all flex items-start gap-4"
                    >
                      <div className="text-4xl p-3 bg-primary-50 dark:bg-primary-900/30 rounded-xl group-hover:scale-110 transition-transform">
                        {exam.icon || '📚'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary-600 transition-colors">
                            {exam.name}
                          </h3>
                        </div>
                        {exam.parent && (
                          <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md inline-block mt-1">
                            Under {exam.parent.name}
                          </div>
                        )}
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 line-clamp-2">
                          {exam.description || exam.conductingBody || 'State & National Exam Hub'}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs font-semibold text-primary-600 dark:text-primary-400">
                          <span className="bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
                            {exam.courseCount || exam.coursesCount || 0} Courses
                          </span>
                          <span className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                            {exam.testCount || exam.testsCount || 0} Tests
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Courses */}
            {results.courses && results.courses.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <HiAcademicCap className="h-6 w-6 text-blue-600" />
                  Courses ({results.courses.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {results.courses.map((course) => (
                    <CourseCard key={course.id || course._id} course={course} />
                  ))}
                </div>
              </section>
            )}

            {/* Test Series Packages */}
            {results.testSeries && results.testSeries.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <HiClipboardList className="h-6 w-6 text-indigo-600" />
                  Test Series Packages ({results.testSeries.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.testSeries.map((series) => (
                    <Link
                      key={series.id || series._id}
                      to={`/test-series/${series.slug || series.id || series._id}`}
                      className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                            {series.category?.name || 'Test Series'}
                          </span>
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {series.price === 0 ? 'FREE' : `₹${series.price}`}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                          {series.title}
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2">
                          {series.description}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
                        <span>{series.tests?.length || 0} Mock Tests Included</span>
                        <span className="text-indigo-600 font-bold group-hover:translate-x-1 transition-transform">
                          View Pack →
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Mock Tests */}
            {results.tests && results.tests.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <HiClipboardList className="h-6 w-6 text-green-600" />
                  Mock Tests ({results.tests.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {results.tests.map((test) => (
                    <TestCard key={test.id || test._id} test={test} />
                  ))}
                </div>
              </section>
            )}

            {/* Free Resources */}
            {results.resources && results.resources.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <HiDocumentText className="h-6 w-6 text-purple-600" />
                  Free Study Material ({results.resources.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.resources.map((res) => (
                    <a
                      key={res.id || res._id}
                      href={res.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-purple-500 transition-all"
                    >
                      <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 text-purple-600">
                        <HiOutlineDocumentText className="h-6 w-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white">
                          {res.title}
                        </h4>
                        {res.description && (
                          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                            {res.description}
                          </p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Blogs & Job Alerts */}
            {results.blogs && results.blogs.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <HiNewspaper className="h-6 w-6 text-amber-600" />
                  Updates & Job Alerts ({results.blogs.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {results.blogs.map((blog) => (
                    <Link
                      key={blog.id || blog._id}
                      to={`/blog/${blog.slug}`}
                      className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-500 transition-all block"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            blog.type === 'job_alert'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {blog.type === 'job_alert' ? 'Job Alert' : 'Article'}
                        </span>
                      </div>
                      <h4 className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                        {blog.title}
                      </h4>
                      {blog.excerpt && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{blog.excerpt}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
