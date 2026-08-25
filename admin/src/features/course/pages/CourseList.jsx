import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchCourses,
  deleteCourse,
  togglePublish,
  toggleFeatured,
} from '@/features/course/courseSlice';
import { formatCurrency, formatDate, getStatusColor, truncate } from '@/utils';
import useDebounce from '@/hooks/useDebounce';
import DataTable from '@/components/DataTable';
import StatsCard from '@/components/StatsCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import {
  BookOpen,
  Plus,
  Eye,
  ToggleLeft,
  ToggleRight,
  Star,
  StarOff,
  Edit,
  Trash2,
  Search,
  Filter,
  Layers,
  Users,
  CheckCircle2,
  IndianRupee,
} from 'lucide-react';

export default function CourseList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, pagination, loading } = useSelector((s) => s.courses);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebounce(search);

  const load = useCallback(() => {
    dispatch(
      fetchCourses({
        page,
        limit: 10,
        search: debouncedSearch,
        status: statusFilter,
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
      await dispatch(deleteCourse(deleteTarget));
      setDeleteTarget(null);
    }
  };

  // KPIs
  const totalCourses = pagination?.total || list.length;
  const publishedCount = list.filter((c) => c.isPublished || c.status === 'published').length;
  const draftCount = list.filter((c) => !c.isPublished && c.status !== 'published').length;
  const totalStudents = list.reduce(
    (acc, c) => acc + (c.enrollmentCount || c._count?.enrollments || 0),
    0
  );

  const columns = [
    {
      key: 'title',
      label: 'Course',
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          {row.thumbnail?.url || row.thumbnail ? (
            <img
              src={row.thumbnail?.url || row.thumbnail}
              alt=""
              className="w-12 h-8 rounded object-cover shadow-sm"
            />
          ) : (
            <div className="w-12 h-8 rounded bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-primary-600" />
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{truncate(row.title, 40)}</p>
            <p className="text-xs text-gray-500">
              Instructor: {row.teacher?.name || 'Assigned Teacher'}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      label: 'Price',
      sortable: true,
      render: (val) =>
        val > 0 ? (
          formatCurrency(val)
        ) : (
          <span className="text-emerald-600 font-semibold">Free</span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (_, row) => {
        const isPub = row.isPublished || row.status === 'published';
        return (
          <span className={`badge ${isPub ? 'badge-success' : 'badge-warning'}`}>
            {isPub ? 'Published' : 'Draft'}
          </span>
        );
      },
    },
    {
      key: 'enrollmentCount',
      label: 'Enrolled',
      sortable: true,
      render: (val, row) => (
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {val || row._count?.enrollments || 0}
        </span>
      ),
    },
    { key: 'createdAt', label: 'Created', sortable: true, render: (val) => formatDate(val) },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Courses Management</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Create, moderate, publish, and inspect all platform curriculum
          </p>
        </div>
        <button onClick={() => navigate('/courses/create')} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add New Course
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard icon={BookOpen} label="Total Courses" value={totalCourses} color="primary" />
        <StatsCard
          icon={CheckCircle2}
          label="Published Courses"
          value={publishedCount}
          color="emerald"
        />
        <StatsCard icon={Layers} label="Draft Courses" value={draftCount} color="amber" />
        <StatsCard icon={Users} label="Total Enrollments" value={totalStudents} color="blue" />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="input-field w-44 py-2"
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft Mode</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={list}
        loading={loading}
        pagination={pagination}
        onPageChange={setPage}
        searchable
        searchValue={search}
        onSearch={(val) => {
          setSearch(val);
          setPage(1);
        }}
        searchPlaceholder="Search courses by title or instructor..."
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyMessage="No courses found"
        emptyIcon={BookOpen}
        actions={(row) => {
          const rowId = row.id || row._id;
          const isPub = row.isPublished || row.status === 'published';
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => navigate(`/courses/${rowId}`)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 transition-colors"
                title="View Full Course Curriculum & Students"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => dispatch(togglePublish(rowId))}
                className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  isPub ? 'text-emerald-600' : 'text-gray-400'
                }`}
                title={
                  isPub
                    ? 'Unpublish Course (Set to Draft / Inactive)'
                    : 'Publish Course Live (Active)'
                }
              >
                {isPub ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              </button>
              <button
                onClick={() => dispatch(toggleFeatured(rowId))}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={row.isFeatured ? 'Remove from Featured Courses' : 'Mark as Featured Course'}
              >
                {row.isFeatured ? (
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                ) : (
                  <StarOff className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <button
                onClick={() => navigate(`/courses/${rowId}/edit`)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 transition-colors"
                title="Edit Course Details & Curriculum"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeleteTarget(rowId)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 transition-colors"
                title="Delete Course"
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
        title="Delete Course"
        message="This will permanently delete this course and all associated lessons."
        confirmText="Delete"
      />
    </div>
  );
}
