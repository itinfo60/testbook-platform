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
  Globe,
  Youtube,
  Send as TelegramIcon,
  Twitter,
  Linkedin,
  Sparkles,
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
    avatar: '',
    headerImage: '',
    designation: '',
    qualification: '',
    experience: '',
    specialization: '',
    bio: '',
    showOnFaculty: true,
    isFeatured: false,
    youtube: '',
    telegram: '',
    twitter: '',
    linkedin: '',
    website: '',
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

  const handleToggleFacultyVisibility = async (teacher) => {
    const teacherId = teacher.id || teacher._id;
    try {
      const res = await teachersAPI.toggleFacultyVisibility(teacherId);
      const isVisible = res.data?.data?.showOnFaculty;
      toast.success(`Faculty page visibility ${isVisible ? 'enabled' : 'hidden'}`);
      load();
    } catch {
      toast.error('Failed to update faculty visibility');
    }
  };

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      avatar: '',
      headerImage: '',
      designation: '',
      qualification: '',
      experience: '',
      specialization: '',
      bio: '',
      showOnFaculty: true,
      isFeatured: false,
      youtube: '',
      telegram: '',
      twitter: '',
      linkedin: '',
      website: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (teacher) => {
    const profile =
      typeof teacher.teacherProfile === 'string'
        ? JSON.parse(teacher.teacherProfile)
        : teacher.teacherProfile || {};
    const links = profile.links || profile.socialLinks || {};

    setEditingTeacher(teacher);
    setFormData({
      name: teacher.name || '',
      email: teacher.email || '',
      password: '',
      phone: teacher.phone || '',
      avatar: teacher.avatar?.url || teacher.avatar || '',
      headerImage: profile.headerImage || '',
      designation: profile.designation || profile.headline || '',
      qualification: profile.qualification || '',
      experience: profile.experience || '',
      specialization: Array.isArray(profile.specialization)
        ? profile.specialization.join(', ')
        : profile.specialization || '',
      bio: profile.bio || teacher.bio || '',
      showOnFaculty: profile.showOnFaculty !== false,
      isFeatured: !!profile.isFeatured,
      youtube: links.youtube || '',
      telegram: links.telegram || '',
      twitter: links.twitter || '',
      linkedin: links.linkedin || '',
      website: links.website || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const links = {
        ...(formData.youtube && { youtube: formData.youtube.trim() }),
        ...(formData.telegram && { telegram: formData.telegram.trim() }),
        ...(formData.twitter && { twitter: formData.twitter.trim() }),
        ...(formData.linkedin && { linkedin: formData.linkedin.trim() }),
        ...(formData.website && { website: formData.website.trim() }),
      };

      const payload = {
        name: formData.name,
        phone: formData.phone,
        bio: formData.bio,
        designation: formData.designation,
        headline: formData.designation,
        qualification: formData.qualification,
        experience: formData.experience,
        specialization: formData.specialization
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        showOnFaculty: formData.showOnFaculty,
        isFeatured: formData.isFeatured,
        headerImage: formData.headerImage ? formData.headerImage.trim() : null,
        avatar: formData.avatar ? formData.avatar.trim() : null,
        links,
      };

      if (editingTeacher) {
        const teacherId = editingTeacher.id || editingTeacher._id;
        await teachersAPI.update(teacherId, payload);
        toast.success('Teacher updated successfully');
      } else {
        await teachersAPI.create({
          ...payload,
          email: formData.email,
          password: formData.password,
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
      label: 'Teacher Profile',
      render: (_, row) => {
        const profile =
          typeof row.teacherProfile === 'string'
            ? JSON.parse(row.teacherProfile)
            : row.teacherProfile || {};
        const avatarUrl = row.avatar?.url || row.avatar;

        return (
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={row.name}
                className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shadow-xs flex-shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-sm font-bold flex-shrink-0">
                {row.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-gray-900 dark:text-white text-sm">{row.name}</p>
                {profile.isFeatured && (
                  <span className="badge badge-warning text-[10px] py-0 px-1">Featured</span>
                )}
              </div>
              <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
                {profile.designation || profile.headline || row.email}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: 'specialization',
      label: 'Specialization & Exp',
      render: (_, row) => {
        const profile =
          typeof row.teacherProfile === 'string'
            ? JSON.parse(row.teacherProfile)
            : row.teacherProfile || {};
        const specs = profile.specialization || [];
        return (
          <div>
            {specs.length > 0 ? (
              <div className="flex flex-wrap gap-1 mb-1">
                {specs.slice(0, 2).map((s, idx) => (
                  <span key={idx} className="badge badge-info text-[11px] py-0.5">
                    {s}
                  </span>
                ))}
                {specs.length > 2 && (
                  <span className="text-[10px] text-gray-400">+{specs.length - 2}</span>
                )}
              </div>
            ) : (
              <span className="text-xs text-gray-400">—</span>
            )}
            {profile.experience && (
              <p className="text-[11px] text-gray-500">{profile.experience}</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'showOnFaculty',
      label: 'Faculty Page',
      render: (_, row) => {
        const profile =
          typeof row.teacherProfile === 'string'
            ? JSON.parse(row.teacherProfile)
            : row.teacherProfile || {};
        const isVisible = profile.showOnFaculty !== false;

        return (
          <button
            type="button"
            onClick={() => handleToggleFacultyVisibility(row)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
              isVisible
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
            }`}
            title="Click to toggle visibility on public /faculty page"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${isVisible ? 'bg-emerald-500' : 'bg-gray-400'}`}
            ></span>
            {isVisible ? 'Visible' : 'Hidden'}
          </button>
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
      label: 'Students',
      render: (_, row) => (
        <span className="font-semibold text-gray-800 dark:text-gray-200">
          {row.studentCount || 0}
        </span>
      ),
    },
    {
      key: 'isActive',
      label: 'Account',
      render: (val) => {
        const status = val !== false ? 'active' : 'inactive';
        return <span className={getStatusColor(status)}>{status}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Teachers & Faculty</h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Manage teachers, public /faculty showcase visibility, profiles, and credentials
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
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate(`/teachers/${rowId}`)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 hover:text-primary-600 transition-colors"
                title="View Teacher Analytics"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleOpenEdit(row)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 transition-colors"
                title="Edit Faculty Details & Links"
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
        size="xl"
        title={editingTeacher ? 'Edit Teacher Profile & Faculty Info' : 'Add New Teacher'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
          {/* Section: Basic Info */}
          <div className="pb-2 border-b border-gray-100 dark:border-gray-700">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Basic Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
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
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
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
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Temporary Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field"
                    placeholder="Secure password"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
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
            </div>
          </div>

          {/* Section: Academic & Faculty Details */}
          <div className="pb-2 border-b border-gray-100 dark:border-gray-700">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Faculty & Header Details
            </h4>

            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Designation / Headline
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Senior Faculty - Political Science"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Qualification
                  </label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Ph.D., UGC NET JRF, MA"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Experience
                  </label>
                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    className="input-field"
                    placeholder="e.g. 12+ Years Teaching Experience"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Specializations & Subjects (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Political Science, Indian Polity, RPSC RAS"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Profile Photo / Avatar URL
                  </label>
                  <input
                    type="text"
                    value={formData.avatar}
                    onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                    className="input-field"
                    placeholder="https://.../photo.jpg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Detailed Bio & About
                </label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="input-field"
                  placeholder="Comprehensive bio detailing teaching philosophy, achievements, books authored..."
                />
              </div>
            </div>
          </div>

          {/* Section: Social & External Links */}
          <div className="pb-2 border-b border-gray-100 dark:border-gray-700">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Social & Resource Links
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube Channel
                </label>
                <input
                  type="text"
                  value={formData.youtube}
                  onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                  className="input-field text-xs"
                  placeholder="https://youtube.com/@channel"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <TelegramIcon className="w-3.5 h-3.5 text-sky-500" /> Telegram Channel / Group
                </label>
                <input
                  type="text"
                  value={formData.telegram}
                  onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                  className="input-field text-xs"
                  placeholder="https://t.me/channel"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <Twitter className="w-3.5 h-3.5 text-blue-400" /> Twitter / X Profile
                </label>
                <input
                  type="text"
                  value={formData.twitter}
                  onChange={(e) => setFormData({ ...formData, twitter: e.target.value })}
                  className="input-field text-xs"
                  placeholder="https://x.com/handle"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <Linkedin className="w-3.5 h-3.5 text-blue-600" /> LinkedIn Profile
                </label>
                <input
                  type="text"
                  value={formData.linkedin}
                  onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                  className="input-field text-xs"
                  placeholder="https://linkedin.com/in/profile"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-emerald-500" /> Personal Website / Notes Link
                </label>
                <input
                  type="text"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="input-field text-xs"
                  placeholder="https://mywebsite.com"
                />
              </div>
            </div>
          </div>

          {/* Section: Visibility Controls */}
          <div className="bg-gray-50 dark:bg-gray-800/50 p-3.5 rounded-xl space-y-2.5">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.showOnFaculty}
                onChange={(e) => setFormData({ ...formData, showOnFaculty: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                Show on Public Faculty Page (<span className="text-primary-600">/faculty</span>)
              </span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
              />
              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Featured Mentor Badge (Highlight
                on showcase)
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-700">
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
