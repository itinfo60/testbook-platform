import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ClipboardList,
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  Award,
  CheckCircle,
  HelpCircle,
  FileText,
  Eye,
  Plus,
} from 'lucide-react';
import { testsAPI } from '@/services/api';
import LoadingSpinner from '@/components/loadingSpinner';
import StatsCard from '@/components/StatsCard';
import DataTable from '@/components/DataTable';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDate } from '@/utils';
import toast from 'react-hot-toast';

export default function TestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadTest = async () => {
    setLoading(true);
    try {
      const res = await testsAPI.getById(id);
      const payload = res.data?.data || res.data;
      setData(payload?.test || payload);
    } catch (err) {
      toast.error('Failed to load test details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadTest();
  }, [id]);

  const handleDeleteTest = async () => {
    try {
      await testsAPI.delete(id);
      toast.success('Test deleted successfully');
      navigate('/tests');
    } catch (err) {
      toast.error('Failed to delete test');
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
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Test Not Found</h2>
        <button onClick={() => navigate('/tests')} className="btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tests
        </button>
      </div>
    );
  }

  let questions = [];
  if (typeof data.questions === 'string') {
    try {
      questions = JSON.parse(data.questions);
    } catch (e) {
      questions = [];
    }
  } else if (Array.isArray(data.questions)) {
    questions = data.questions;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/tests')}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center font-bold text-2xl shadow-inner">
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
              Category:{' '}
              {data.categoryId || data.category?.id ? (
                <Link
                  to={`/exam-categories/${data.categoryId || data.category?.id}`}
                  className="font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  {data.category?.name || 'Exam Category'}
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
            onClick={() => navigate(`/tests/${data.id || data._id}/edit`)}
            className="btn-primary gap-2"
          >
            <Edit className="w-4 h-4" /> Edit Test
          </button>
          <button onClick={() => setDeleteTarget(true)} className="btn-danger gap-2">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={Clock}
          label="Test Duration"
          value={`${data.duration || 60} Minutes`}
          color="primary"
        />
        <StatsCard
          icon={Award}
          label="Total Marks"
          value={`${data.totalMarks || 100} Marks`}
          color="emerald"
        />
        <StatsCard
          icon={HelpCircle}
          label="Total Questions"
          value={questions.length || data.totalQuestions || 0}
          color="amber"
        />
        <StatsCard
          icon={CheckCircle}
          label="Passing Marks"
          value={`${data.passingMarks || 40} Marks`}
          color="blue"
        />
      </div>

      {/* Questions Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Questions & Answer Key
            </h3>
            <p className="text-xs text-gray-500">
              {questions.length} Questions configured in this assessment
            </p>
          </div>
          <button
            onClick={() => navigate(`/tests/${data.id || data._id}/edit`)}
            className="btn-secondary gap-2 text-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Modify Questions
          </button>
        </div>

        {questions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No questions added to this test yet.</p>
        ) : (
          <div className="space-y-6">
            {questions.map((q, qIdx) => {
              const options = q.options || [];
              return (
                <div
                  key={q.id || qIdx}
                  className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                      <span className="text-primary-600 font-bold mr-2">Q{qIdx + 1}.</span>
                      {q.questionText || q.question}
                    </h4>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 shrink-0">
                      +{q.marks || 1} / -{q.negativeMarks || 0}
                    </span>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {options.map((opt, oIdx) => {
                      const optText = typeof opt === 'string' ? opt : opt.text || opt.optionText;
                      const isCorrect =
                        typeof opt === 'object'
                          ? opt.isCorrect
                          : q.correctAnswer === oIdx || q.correctOption === oIdx;
                      return (
                        <div
                          key={oIdx}
                          className={`p-3 rounded-xl border text-sm flex items-center gap-3 transition-colors ${
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-300 font-semibold'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}
                          </span>
                          <span className="flex-1">{optText}</span>
                          {isCorrect && (
                            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {q.explanation && (
                    <div className="pt-2 text-xs text-gray-600 dark:text-gray-300 bg-blue-50/50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                      <strong className="text-blue-700 dark:text-blue-400">Explanation: </strong>
                      {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteTest}
        title="Delete Test"
        message="Are you sure you want to permanently delete this test and its attempts?"
        confirmText="Delete"
      />
    </div>
  );
}
