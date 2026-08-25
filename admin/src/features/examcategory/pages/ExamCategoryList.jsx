import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  FolderOpen,
  Edit,
  Trash2,
  GitBranch,
  Eye,
  ClipboardList,
  BookOpen,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { fetchExamCategories, deleteExamCategory } from '@/features/examcategory/examCategorySlice';
import DataTable from '@/components/DataTable';
import StatsCard from '@/components/StatsCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import { formatDate } from '@/utils';

export default function ExamCategoryList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, pagination, loading } = useSelector((s) => s.examCategories);
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    dispatch(fetchExamCategories({ page, limit: 50 }));
  }, [dispatch, page]);

  const handleDelete = async () => {
    if (deleteTarget) {
      await dispatch(deleteExamCategory(deleteTarget));
      setDeleteTarget(null);
    }
  };

  const filteredList = list.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.slug || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalExams = list.length;
  const activeExams = list.filter((c) => c.isActive !== false).length;
  const totalCourses = list.reduce(
    (acc, c) => acc + (c.coursesCount || c.courseCount || c._count?.courses || 0),
    0
  );
  const totalTests = list.reduce(
    (acc, c) => acc + (c.testsCount || c.testCount || c._count?.tests || 0),
    0
  );

  const columns = [
    {
      key: 'name',
      label: 'Exam Name',
      sortable: true,
      render: (val, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold text-sm">
            {row.icon || <ClipboardList className="w-4 h-4" />}
          </div>
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">{val}</span>
            {row.parent && (
              <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                <GitBranch className="w-3 h-3" />
                <span>Parent: {row.parent?.name || 'Category'}</span>
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'slug',
      label: 'Slug / Code',
      render: (val) => (
        <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{val}</code>
      ),
    },
    {
      key: 'courseCount',
      label: 'Courses',
      render: (val, row) => val || row.coursesCount || row._count?.courses || 0,
    },
    {
      key: 'testCount',
      label: 'Mock Tests',
      render: (val, row) => val || row.testsCount || row._count?.tests || 0,
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (val) => (
        <span className={`badge ${val !== false ? 'badge-success' : 'badge-neutral'}`}>
          {val !== false ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (val) => formatDate(val),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Exam Hubs & Categories
          </h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Manage target exams, test series, syllabus, and prep content
          </p>
        </div>
        <button onClick={() => navigate('/exam-categories/create')} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add Exam
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard icon={ClipboardList} label="Total Exams" value={totalExams} color="primary" />
        <StatsCard icon={CheckCircle2} label="Active Exams" value={activeExams} color="emerald" />
        <StatsCard icon={BookOpen} label="Target Courses" value={totalCourses} color="amber" />
        <StatsCard icon={FileText} label="Mock Tests" value={totalTests} color="blue" />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredList}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        searchable
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Search exams by name or slug..."
        emptyMessage="No exam categories found"
        emptyIcon={FolderOpen}
        actions={(row) => {
          const rowId = row.id || row._id;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => navigate(`/exam-categories/${rowId}`)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
                title="View Exam Hub & Attached Content"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate(`/exam-categories/${rowId}/edit`)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600"
                title="Edit Exam"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteTarget(rowId)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
                title="Delete"
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
        title="Delete Exam"
        message="Are you sure? Any courses or test series attached to this exam will need reassignment."
        confirmText="Delete"
      />
    </div>
  );
}
