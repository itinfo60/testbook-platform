import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ClipboardList,
  ArrowLeft,
  Edit,
  Trash2,
  BookOpen,
  IndianRupee,
  Eye,
  Plus,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { testSeriesAPI } from '@/services/api';
import LoadingSpinner from '@/components/loadingSpinner';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDate } from '@/utils';
import toast from 'react-hot-toast';

export default function TestSeriesDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadSeries = async () => {
    setLoading(true);
    try {
      const res = await testSeriesAPI.getBySlug(id);
      const payload = res.data?.data || res.data;
      setData(payload?.testSeries || payload);
    } catch (err) {
      toast.error('Failed to load test series');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadSeries();
  }, [id]);

  const handleDelete = async () => {
    try {
      await testSeriesAPI.delete(id);
      toast.success('Test series deleted successfully');
      navigate('/test-series');
    } catch (err) {
      toast.error('Failed to delete test series');
    } finally {
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 space-y-4">
        <ClipboardList className="w-12 h-12 text-gray-400 mx-auto" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Test Series Not Found
        </h2>
        <button onClick={() => navigate('/test-series')} className="btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Test Series
        </button>
      </div>
    );
  }

  const testsList = Array.isArray(data.tests) ? data.tests : [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/test-series')}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center font-bold text-2xl shadow-inner">
            <ClipboardList className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{data.title}</h1>
              <span className={`badge ${data.isPublished ? 'badge-success' : 'badge-warning'}`}>
                {data.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Category / Target Exam:{' '}
              {data.categoryId || data.category?.id ? (
                <Link
                  to={`/exam-categories/${data.categoryId || data.category?.id}`}
                  className="font-bold text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {data.category?.name || 'Target Exam Category'}
                </Link>
              ) : (
                <strong className="text-gray-800 dark:text-gray-200">
                  {data.category?.name || 'General Exam'}
                </strong>
              )}
              {data.description && <span className="ml-3">{data.description}</span>}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/test-series/${data.id || data._id}/edit`)}
            className="btn-primary gap-2"
          >
            <Edit className="w-4 h-4" /> Edit Series
          </button>
          <button onClick={() => setDeleteTarget(true)} className="btn-danger gap-2">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatsCard
          icon={FileText}
          label="Included Tests"
          value={testsList.length}
          color="primary"
        />
        <StatsCard
          icon={IndianRupee}
          label="Package Price"
          value={data.price > 0 ? `₹${data.price}` : 'Free'}
          color="emerald"
        />
        <StatsCard
          icon={CheckCircle}
          label="Status"
          value={data.isPublished ? 'Live & Published' : 'Draft Mode'}
          color="amber"
        />
      </div>

      {/* Included Tests */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Tests in this Series ({testsList.length})
          </h3>
          <button
            onClick={() => navigate(`/tests/create?testSeries=${data.id || data._id}`)}
            className="btn-primary text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add Test to Series
          </button>
        </div>

        {testsList.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tests added to this series package.</p>
        ) : (
          <div className="divide-y dark:divide-gray-700">
            {testsList.map((t, idx) => {
              const testId = typeof t === 'string' ? t : t.id || t._id;
              const testTitle =
                typeof t === 'string' ? `Mock Test #${idx + 1}` : t.title || 'Mock Test';
              return (
                <div
                  key={idx}
                  className="py-3.5 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-750/50 px-2 rounded-xl transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <Link
                        to={`/tests/${testId}`}
                        className="font-bold text-sm text-gray-900 dark:text-white hover:text-primary-600 hover:underline"
                      >
                        {testTitle}
                      </Link>
                      {typeof t === 'object' && t.duration && (
                        <p className="text-xs text-gray-500">
                          {t.duration} mins • {t.totalMarks || 100} Marks • {t.totalQuestions || 0}{' '}
                          Questions
                        </p>
                      )}
                    </div>
                  </div>

                  <Link
                    to={`/tests/${testId}`}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-primary-600 font-semibold text-xs flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> View Test
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Test Series"
        message="Are you sure you want to delete this test series?"
        confirmText="Delete"
      />
    </div>
  );
}
