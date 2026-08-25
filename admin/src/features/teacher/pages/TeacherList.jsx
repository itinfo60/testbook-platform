import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  ToggleLeft,
  ToggleRight,
  Eye,
  Plus,
  Edit,
  Trash2,
  BookOpen,
  IndianRupee,
  Search,
} from 'lucide-react';
import { fetchTeachers } from '@/features/teacher/teacherSlice';
import { teachersAPI } from '@/services/api';
import DataTable from '@/components/DataTable';
import StatsCard from '@/components/StatsCard';
import ConfirmDialog from '@/components/ConfirmDialog';
import Modal from '@/components/Modal';
import { getStatusColor, formatDate } from '@/utils';
import useDebounce from '@/hooks/useDebounce';
import toast from 'react-hot-toast';

export default function TeacherList() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, pagination, loading } = useSelector((s) => s.teachers);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const debouncedSearch = useDebounce(search);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    bio: '',
    specialization: '',
    experience: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(() => {
    dispatch(
      fetchTeachers({
        page,
        limit: 10,
        search: debouncedSearch || undefined,
        isActive: statusFilter ? statusFilter === 'active' : undefined,
      })
    );
  }, [dispatch, page, debouncedSearch, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleStatus = async (teacher) => {
    const teacherId = teacher.id || teacher._id;
    const newStatus = teacher.isActive === false;
    try {
      await teachersAPI.toggleStatus(teacherId, newStatus);
      toast.success(`Teacher ${newStatus ? 'activated' : 'deactivated'}`);
      load();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      bio: '',
      specialization: '',
      experience: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (teacher) => {
    const profile =
      typeof teacher.teacherProfile === 'string'
        ? JSON.parse(teacher.teacherProfile)
        : teacher.teacherProfile || {};
    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name || '',
      email: teacher.email || '',
      password: '',
      phone: teacher.phone || '',
      bio: profile.bio || teacher.bio || '',
      specialization: Array.isArray(profile.specialization)
        ? profile.specialization.join(', ')
        : profile.specialization || '',
      experience: profile.experience || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingTeacher) {
        const teacherId = editingTeacher.id || editingTeacher._id;
        await teachersAPI.update(teacherId, {
          name: formData.name,
          phone: formData.phone,
          bio: formData.bio,
          specialization: formData.specialization
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          experience: formData.experience,
        });
        toast.success('Teacher updated successfully');
      } else {
        await teachersAPI.create({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          bio: formData.bio,
          specialization: formData.specialization
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
          experience: formData.experience,
        });
        toast.success('Teacher created successfully');
      }
      setIsModalOpen(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await teachersAPI.delete(deleteTarget);
      toast.success('Teacher deactivated');
      load();
    } catch (err) {
      toast.error('Failed to remove teacher');
    } finally {
      setDeleteTarget(null);
    }
  };

  // Aggregated KPIs
  const totalTeachers = pagination?.total || list.length;
  const activeTeachers = list.filter((t) => t.isActive !== false).length;
  const totalCourses = list.reduce((acc, t) => acc + (t.courseCount || 0), 0);
  const totalStudents = list.reduce((acc, t) => acc + (t.studentCount || 0), 0);
  const totalRevenue = list.reduce((acc, t) => acc + (t.totalRevenue || 0), 0);

  const columns = [
    {
      key: 'name',
      label: 'Teacher',
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-sm font-bold">
            {row.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
            <p className="text-xs text-gray-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'specialization',
      label: 'Specialization',
      render: (_, row) => {
        const profile =
          typeof row.teacherProfile === 'string'
            ? JSON.parse(row.teacherProfile)
            : row.teacherProfile || {};
        const specs = profile.specialization || [];
        return specs.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {specs.map((s, idx) => (
              <span key={idx} className="badge badge-info text-xs">
                {s}
              </span>
            ))}
          </div>
        ) : (
          '—'
        );
      },
    },
    {
      key: 'courses',
      label: 'Courses',
      render: (_, row) => (
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {row.courseCount || 0}
        </span>
      ),
    },
    {
      key: 'totalStudents',
      label: 'Students Taught',
      render: (_, row) => (
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {row.studentCount || 0}
        </span>
      ),
    },
    {
      key: 'totalRevenue',
      label: 'Revenue Earned',
      render: (_, row) => {
        const rev = row.totalRevenue || 0;
        return <span className="font-semibold text-emerald-600">₹{rev.toLocaleString()}</span>;
      },
    },
    {
      key: 'isActive',
      label: 'Status',
      render: (val) => {
        const status = val !== false ? 'active' : 'inactive';
        return <span className={getStatusColor(status)}>{status}</span>;
      },
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (val) => formatDate(val),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Teachers Management</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Manage teachers, assignments, student reaches, and earnings
          </p>
        </div>
        <button onClick={handleOpenAdd} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Add New Teacher
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatsCard
          icon={Users}
          label="Total Teachers"
          value={totalTeachers}
          trend={`${activeTeachers} Active`}
          color="primary"
        />
        <StatsCard icon={BookOpen} label="Courses Created" value={totalCourses} color="emerald" />
        <StatsCard icon={CheckCircle} label="Students Reach" value={totalStudents} color="amber" />
        <StatsCard
          icon={IndianRupee}
          label="Total Earnings"
          value={`₹${totalRevenue.toLocaleString()}`}
          color="blue"
        />
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
          <option value="active">Active Teachers</option>
          <option value="inactive">Inactive Teachers</option>
        </select>
      </div>

      {/* Teachers Table */}
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
        searchPlaceholder="Search teachers by name or email..."
        emptyMessage="No teachers found"
        emptyIcon={Users}
        actions={(row) => {
          const rowId = row.id || row._id;
          const isActive = row.isActive !== false;
          return (
            <div className="flex items-center justify-end gap-1">
              <button
                onClick={() => navigate(`/teachers/${rowId}`)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 transition-colors"
                title="View Faculty Profile, Courses & Revenue"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleOpenEdit(row)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 transition-colors"
                title="Edit Faculty Details"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleToggleStatus(row)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title={isActive ? 'Deactivate Teacher Account' : 'Activate Teacher Account'}
              >
                {isActive ? (
                  <ToggleRight className="w-4 h-4 text-emerald-600" />
                ) : (
                  <ToggleLeft className="w-4 h-4 text-gray-400" />
                )}
              </button>
              <button
                onClick={() => setDeleteTarget(rowId)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 transition-colors"
                title="Delete Faculty Account"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        }}
      />

      {/* Add / Edit Teacher Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTeacher ? 'Edit Teacher Profile' : 'Add New Teacher'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input-field"
              placeholder="e.g. Dr. Rajesh Kumar"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              disabled={!!editingTeacher}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input-field disabled:opacity-60"
              placeholder="teacher@example.com"
            />
          </div>

          {!editingTeacher && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field"
                placeholder="Secure temporary password"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="input-field"
              placeholder="e.g. +91 9876543210"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Specializations (comma-separated)
            </label>
            <input
              type="text"
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              className="input-field"
              placeholder="e.g. UPSC Polity, GS Paper II, History"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Bio & Experience
            </label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="input-field"
              placeholder="Short bio and subject credentials..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : editingTeacher ? 'Save Changes' : 'Create Teacher'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Teacher"
        message="Are you sure you want to deactivate this teacher account?"
        confirmText="Deactivate"
      />
    </div>
  );
}
