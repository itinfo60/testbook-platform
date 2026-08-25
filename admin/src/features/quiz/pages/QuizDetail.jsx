import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  HelpCircle,
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  Award,
  CheckCircle,
  Eye,
  Plus,
} from 'lucide-react';
import { quizzesAPI } from '@/services/api';
import LoadingSpinner from '@/components/loadingSpinner';
import StatsCard from '@/components/StatsCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDate } from '@/utils';
import toast from 'react-hot-toast';

export default function QuizDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadQuiz = async () => {
    setLoading(true);
    try {
      const res = await quizzesAPI.getById(id);
      const payload = res.data?.data || res.data;
      setData(payload?.quiz || payload);
    } catch (err) {
      toast.error('Failed to load quiz details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadQuiz();
  }, [id]);

  const handleDeleteQuiz = async () => {
    try {
      await quizzesAPI.delete(id);
      toast.success('Quiz deleted successfully');
      navigate('/quizzes');
    } catch (err) {
      toast.error('Failed to delete quiz');
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
        <HelpCircle className="w-12 h-12 text-gray-400 mx-auto" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Quiz Not Found</h2>
        <button onClick={() => navigate('/quizzes')} className="btn-primary">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Quizzes
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
            onClick={() => navigate('/quizzes')}
            className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center font-bold text-2xl shadow-inner">
            <HelpCircle className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{data.title}</h1>
              <span className={`badge ${data.isPublished ? 'badge-success' : 'badge-warning'}`}>
                {data.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            {data.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{data.description}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/quizzes/${data.id || data._id}/edit`)}
            className="btn-primary gap-2"
          >
            <Edit className="w-4 h-4" /> Edit Quiz
          </button>
          <button onClick={() => setDeleteTarget(true)} className="btn-danger gap-2">
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <StatsCard
          icon={HelpCircle}
          label="Total Questions"
          value={questions.length}
          color="primary"
        />
        <StatsCard
          icon={Clock}
          label="Time Limit"
          value={data.timeLimit ? `${data.timeLimit} Mins` : 'Untimed'}
          color="amber"
        />
        <StatsCard
          icon={Award}
          label="Passing Score"
          value={`${data.passingScore || 60}%`}
          color="emerald"
        />
      </div>

      {/* Questions List */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-700 pb-4">
          Quiz Questions ({questions.length})
        </h3>

        {questions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No questions added yet.</p>
        ) : (
          <div className="space-y-5">
            {questions.map((q, qIdx) => {
              const options = q.options || [];
              return (
                <div
                  key={q.id || qIdx}
                  className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 space-y-3"
                >
                  <h4 className="font-semibold text-gray-900 dark:text-white text-base">
                    <span className="text-purple-600 font-bold mr-2">Q{qIdx + 1}.</span>
                    {q.questionText || q.question}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {options.map((opt, oIdx) => {
                      const optText = typeof opt === 'string' ? opt : opt.text;
                      const isCorrect =
                        typeof opt === 'object' ? opt.isCorrect : q.correctAnswer === oIdx;
                      return (
                        <div
                          key={oIdx}
                          className={`p-3 rounded-xl border text-sm flex items-center gap-3 ${
                            isCorrect
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-300 font-semibold'
                              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isCorrect
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600'
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteQuiz}
        title="Delete Quiz"
        message="Are you sure you want to delete this quiz?"
        confirmText="Delete"
      />
    </div>
  );
}
