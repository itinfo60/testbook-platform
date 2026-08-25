import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Brain,
  Eye,
  Trash2,
  Plus,
  Edit,
  HelpCircle,
  CheckCircle2,
  Layers,
  Award,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchQuizzes, deleteQuiz } from '@/features/quiz/quizSlice';
import { quizzesAPI } from '@/services/api';
import toast from 'react-hot-toast';
import DataTable from '@/components/DataTable';
import StatsCard from '@/components/StatsCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { getStatusColor, formatDate, truncate } from '@/utils';
import useDebounce from '@/hooks/useDebounce';

export default function QuizOversight() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { list, pagination, loading } = useSelector((s) => s.quizzes);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'published' | 'draft'
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const debouncedSearch = useDebounce(search);

  const load = useCallback(() => {
    dispatch(
      fetchQuizzes({
        page,
        limit: 10,
        search: debouncedSearch,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sort: sortField,
        order: sortOrder,
      })
    );
  }, [dispatch, page, debouncedSearch, statusFilter, sortField, sortOrder]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSort = (field) => {
    if (sortField === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async () => {
    if (deleteTarget) {
      await dispatch(deleteQuiz(deleteTarget));
      setDeleteTarget(null);
      load();
    }
  };

  const handleTogglePublish = async (id, isPublished) => {
    try {
      await quizzesAPI.update(id, { isPublished: !isPublished });
      toast.success(`Quiz ${!isPublished ? 'published' : 'moved to draft'}`);
      load();
    } catch {
      toast.error('Failed to update quiz status');
    }
  };

  // KPIs
  const totalQuizzes = pagination?.total || list.length;
  const publishedQuizzes = list.filter(
    (q) => q.isPublished || q.status === 'active' || q.status === 'published'
  ).length;
  const totalQuestions = list.reduce(
    (acc, q) => acc + (Array.isArray(q.questions) ? q.questions.length : 0),
    0
  );
  const totalAttempts = list.reduce(
    (acc, q) => acc + (q.totalAttempts || q._count?.attempts || 0),
    0
  );

  // Client-side fallback filter
  const displayedList = list.filter((item) => {
    const isPub = item.isPublished || item.status === 'active' || item.status === 'published';
    if (statusFilter === 'published') return isPub;
    if (statusFilter === 'draft') return !isPub;
    return true;
  });

  const columns = [
    {
      key: 'title',
      label: 'Quiz Title',
      sortable: true,
      render: (_, row) => {
        const rowId = row.id || row._id;
        return (
          <div>
            <Link
              to={`/quizzes/${rowId}`}
              className="font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 hover:underline"
            >
              {truncate(row.title, 45)}
            </Link>
            <p className="text-xs text-gray-500">
              Target: {row.examCategory || row.course?.title || 'General Practice'}
            </p>
          </div>
        );
      },
    },
    {
      key: 'questions',
      label: 'Questions',
      render: (val) => (Array.isArray(val) ? val.length : val || 0),
    },
    {
      key: 'totalAttempts',
      label: 'Student Attempts',
      sortable: true,
      render: (val, row) => val || row._count?.attempts || 0,
    },
    {
      key: 'passingScore',
      label: 'Passing Score',
      render: (val) => (val ? `${val}%` : '60%'),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (val, row) => {
        const isPub = row.isPublished || val === 'active' || val === 'published';
        return (
          <span className={`badge ${isPub ? 'badge-success' : 'badge-warning'}`}>
            {isPub ? 'Published' : 'Draft'}
          </span>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (val) => formatDate(val),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Quizzes Oversight</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Create, moderate, inspect questions, and review student quiz participation
          </p>
        </div>
        <button onClick={() => navigate('/quizzes/create')} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Create New Quiz
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={HelpCircle}
          title="Total Quizzes"
          value={totalQuizzes}
          color="primary"
          onClick={() => setStatusFilter('all')}
          subtitle="All quiz sessions"
        />
        <StatsCard
          icon={CheckCircle2}
          title="Published Quizzes"
          value={publishedQuizzes}
          color="emerald"
          onClick={() => setStatusFilter('published')}
          subtitle="Active and visible"
        />
        <StatsCard
          icon={Layers}
          title="Total Questions"
          value={totalQuestions}
          color="amber"
          subtitle="In quiz decks"
        />
        <StatsCard
          icon={Award}
          title="Quiz Attempts"
          value={totalAttempts}
          color="blue"
          subtitle="Completed quizzes"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 gap-4">
        {[
          { key: 'all', label: 'All Quizzes' },
          { key: 'published', label: 'Published' },
          { key: 'draft', label: 'Drafts' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setStatusFilter(tab.key);
              setPage(1);
            }}
            className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${
              statusFilter === tab.key
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={displayedList}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        searchable
        searchValue={search}
        onSearch={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search quizzes by title..."
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyMessage="No quizzes found"
        emptyIcon={Brain}
        actions={(row) => {
          const rowId = row.id || row._id;
          const isPub = row.isPublished || row.status === 'active' || row.status === 'published';
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => handleTogglePublish(rowId, isPub)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={isPub ? 'Unpublish Quiz (Set to Draft)' : 'Publish Quiz Live'}
              >
                {isPub ? (
                  <ToggleRight className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <button
                onClick={() => navigate(`/quizzes/${rowId}`)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 transition-colors"
                title="View Quiz Questions & Answers"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate(`/quizzes/${rowId}/edit`)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 transition-colors"
                title="Edit Quiz Questions & Settings"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteTarget(rowId)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 transition-colors"
                title="Delete Quiz"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        }}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Quiz"
        message="Are you sure you want to delete this quiz?"
        confirmText="Delete"
      />
    </div>
  );
}
