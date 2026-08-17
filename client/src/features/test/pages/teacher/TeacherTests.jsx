import LoadingSpinner from '@/components/common/LoadingSpinner';
import { Button } from '@/components/ui';
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  HiAcademicCap,
  HiChartBar,
  HiCheckCircle,
  HiClipboardList,
  HiExternalLink,
  HiPencil,
  HiPlus,
  HiTrash,
  HiX,
} from 'react-icons/hi';
import { fetchTeacherTests } from '@/features/test/testSlice';

export default function TeacherTests() {
  const [activeTab, setActiveTab] = useState('series'); // 'series' or 'tests'
  const [testSeriesList, setTestSeriesList] = useState([]);
  const [testsList, setTestsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Series modal state
  const [seriesModalOpen, setSeriesModalOpen] = useState(false);
  const [editingSeriesId, setEditingSeriesId] = useState(null);
  const [savingSeries, setSavingSeries] = useState(false);

  const initialSeriesForm = {
    title: '',
    slug: '',
    description: '',
    examCategory: '',
    subject: 'General Studies',
    testType: 'full_length',
    language: 'Bilingual',
    price: 199,
    discountPrice: 99,
    isFree: false,
    testsCount: 20,
    questionsCount: 300,
    totalMarks: 400,
    duration: 180,
    thumbnailUrl: '',
    isPublished: true,
  };

  const [seriesForm, setSeriesForm] = useState(initialSeriesForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [seriesRes, testsRes, catList] = await Promise.all([
        testSeriesAPI.getAll({ limit: 100 }).catch(() => ({ data: { data: { testSeries: [] } } })),
        testAPI.getTeacherTests().catch(() => ({ data: { data: [] } })),
        getUnifiedExamCategories(),
      ]);

      const sList =
        seriesRes.data?.data?.testSeries ||
        seriesRes.data?.data ||
        seriesRes.data?.testSeries ||
        [];
      setTestSeriesList(Array.isArray(sList) ? sList : []);

      const tList = testsRes.data?.data?.tests || testsRes.data?.data || testsRes.data?.tests || [];
      setTestsList(Array.isArray(tList) ? tList : []);

      setCategories(catList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Series modal handlers
  const handleOpenCreateSeries = () => {
    setEditingSeriesId(null);
    setSeriesForm(initialSeriesForm);
    setSeriesModalOpen(true);
  };

  const handleOpenEditSeries = (s) => {
    setEditingSeriesId(s._id);
    setSeriesForm({
      title: s.title || '',
      slug: s.slug || '',
      description: s.description || '',
      examCategory: s.examCategory?._id || s.examCategory || '',
      subject: s.subject || 'General Studies',
      testType: s.testType || 'full_length',
      language: s.language || 'Bilingual',
      price: s.price || 0,
      discountPrice: s.discountPrice || 0,
      isFree: s.isFree || false,
      testsCount: s.testsCount || 20,
      questionsCount: s.questionsCount || 300,
      totalMarks: s.totalMarks || 400,
      duration: s.duration || 180,
      thumbnailUrl: s.thumbnail?.url || s.thumbnail || '',
      isPublished: s.isPublished !== false,
    });
    setSeriesModalOpen(true);
  };

  const handleDeleteSeries = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete Test Series "${title}"?`)) return;
    try {
      await testSeriesAPI.delete(id);
      toast.success('Test Series deleted');
      setTestSeriesList((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      toast.error('Failed to delete series');
    }
  };

  const handleDeleteTest = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete test "${title}"?`)) return;
    try {
      await testAPI.delete(id);
      toast.success('Test deleted');
      setTestsList((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      toast.error('Failed to delete test');
    }
  };

  const handleSaveSeries = async (e) => {
    e.preventDefault();
    if (!seriesForm.title.trim()) {
      toast.error('Series title is required');
      return;
    }
    if (!seriesForm.examCategory) {
      toast.error('Please select an Exam Category');
      return;
    }

    setSavingSeries(true);
    try {
      const payload = {
        title: seriesForm.title.trim(),
        slug: seriesForm.slug.trim() || undefined,
        description: seriesForm.description.trim(),
        examCategory: seriesForm.examCategory,
        subject: seriesForm.subject,
        testType: seriesForm.testType,
        language: seriesForm.language,
        price: seriesForm.isFree ? 0 : Number(seriesForm.price) || 0,
        discountPrice: seriesForm.isFree ? 0 : Number(seriesForm.discountPrice) || 0,
        isFree: seriesForm.isFree,
        testsCount: Number(seriesForm.testsCount) || 0,
        questionsCount: Number(seriesForm.questionsCount) || 0,
        totalMarks: Number(seriesForm.totalMarks) || 0,
        duration: Number(seriesForm.duration) || 0,
        thumbnail: { url: seriesForm.thumbnailUrl },
        isPublished: seriesForm.isPublished,
      };

      if (editingSeriesId) {
        await testSeriesAPI.update(editingSeriesId, payload);
        toast.success('Test Series updated!');
      } else {
        await testSeriesAPI.create(payload);
        toast.success('Test Series created successfully!');
      }

      setSeriesModalOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to save test series');
    } finally {
      setSavingSeries(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-dark-900 p-6 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">
            <HiAcademicCap className="h-4 w-4" /> Assessment Studio
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white font-display">
            Test Series & Mock Tests
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            Create multi-test series packages and individual chapter drills with bilingual
            questions.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleOpenCreateSeries}
            className="inline-flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all text-xs sm:text-sm"
          >
            <HiPlus className="h-4 w-4" /> Create Test Series
          </button>
          <Link
            to="/teacher/tests/new"
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-dark-800 dark:hover:bg-dark-700 font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all text-xs sm:text-sm"
          >
            <HiPlus className="h-4 w-4" /> Add Single Test
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-white dark:bg-dark-900 p-1.5 rounded-2xl border border-slate-200 dark:border-dark-800 shadow-sm w-full sm:w-auto">
        <button
          onClick={() => setActiveTab('series')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'series'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-dark-300 hover:bg-slate-50'
          }`}
        >
          <HiClipboardList className="h-4 w-4" />
          <span>Test Series Packages</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20">
            {testSeriesList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
            activeTab === 'tests'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-dark-300 hover:bg-slate-50'
          }`}
        >
          <HiAcademicCap className="h-4 w-4" />
          <span>Individual Tests / Drills</span>
          <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/20">
            {testsList.length}
          </span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="py-20 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : activeTab === 'series' ? (
        /* ════════ TAB 1: TEST SERIES PACKAGES ════════ */
        testSeriesList.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-dark-900 rounded-2xl border border-dashed border-slate-200 dark:border-dark-800 p-8">
            <HiClipboardList className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-dark-900 dark:text-white mb-1">
              No Test Series Packages Yet
            </h3>
            <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
              Test Series packages allow you to bundle 20+ chapter drills, PYQs, and full mocks
              under one package.
            </p>
            <button
              onClick={handleOpenCreateSeries}
              className="inline-flex items-center gap-1.5 bg-primary-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm hover:bg-primary-700"
            >
              <HiPlus className="h-4 w-4" /> Create First Test Series
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testSeriesList.map((series) => (
              <div
                key={series._id}
                className="bg-white dark:bg-dark-900 rounded-2xl p-5 border border-slate-200 dark:border-dark-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-100">
                      {series.examCategory?.name || 'Exam Pack'}
                    </span>
                    <span className="text-xs font-bold text-dark-900 dark:text-white">
                      {series.isFree || (series.discountPrice === 0 && series.price === 0)
                        ? 'FREE'
                        : `₹${series.discountPrice || series.price}`}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-dark-900 dark:text-white line-clamp-2 mb-2 leading-snug">
                    {series.title}
                  </h3>

                  <p className="text-xs text-slate-500 font-normal line-clamp-2 mb-4 leading-relaxed">
                    {series.description ||
                      'Comprehensive test series with detailed solutions and ranking.'}
                  </p>

                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-dark-300 bg-slate-50 dark:bg-dark-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-dark-700 mb-4">
                    <span className="font-medium">🎯 {series.testsCount || 20} Tests</span>
                    <span>•</span>
                    <span className="font-medium">⏱️ {series.duration || 180} Mins</span>
                    <span>•</span>
                    <span className="font-medium">🌐 {series.language || 'Bilingual'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between">
                  <Link
                    to={`/test-series/${series.slug || series._id}`}
                    target="_blank"
                    className="text-xs font-semibold text-slate-500 hover:text-primary-600 flex items-center gap-1"
                  >
                    <HiExternalLink className="h-3.5 w-3.5" /> View Series Page
                  </Link>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditSeries(series)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-primary-50 text-slate-600 hover:text-primary-600 dark:bg-dark-800 transition-colors"
                      title="Edit Series"
                    >
                      <HiPencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSeries(series._id, series.title)}
                      className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-dark-800 transition-colors"
                      title="Delete Series"
                    >
                      <HiTrash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : /* ════════ TAB 2: INDIVIDUAL TESTS / DRILLS ════════ */
      testsList.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-dark-900 rounded-2xl border border-dashed border-slate-200 dark:border-dark-800 p-8">
          <HiAcademicCap className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-dark-900 dark:text-white mb-1">
            No Individual Tests Created
          </h3>
          <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
            Create chapter drills, mock papers, and practice tests with bilingual questions and
            marking rules.
          </p>
          <Link
            to="/teacher/tests/new"
            className="inline-flex items-center gap-1.5 bg-primary-600 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm hover:bg-primary-700"
          >
            <HiPlus className="h-4 w-4" /> Create First Test
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testsList.map((test) => (
            <div
              key={test._id}
              className="bg-white dark:bg-dark-900 rounded-2xl p-5 border border-slate-200 dark:border-dark-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-100">
                    {test.category?.name || 'Mock Drill'}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {test.difficulty || 'Medium'}
                  </span>
                </div>

                <h3 className="text-sm sm:text-base font-bold text-dark-900 dark:text-white line-clamp-2 mb-3 leading-snug">
                  {test.title}
                </h3>

                <div className="grid grid-cols-3 gap-2 text-center bg-slate-50 dark:bg-dark-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-dark-700 mb-4">
                  <div>
                    <div className="text-xs font-bold text-dark-900 dark:text-white">
                      {test.questionsCount || test.questions?.length || 0}
                    </div>
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">
                      Questions
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-dark-900 dark:text-white">
                      {test.duration || 60}m
                    </div>
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">
                      Duration
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-dark-900 dark:text-white">
                      {test.totalAttempts || 0}
                    </div>
                    <div className="text-[9px] text-slate-400 uppercase font-semibold">
                      Attempts
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between">
                <Link
                  to={`/tests/${test._id}`}
                  target="_blank"
                  className="text-xs font-semibold text-slate-500 hover:text-primary-600 flex items-center gap-1"
                >
                  <HiExternalLink className="h-3.5 w-3.5" /> Preview Test
                </Link>

                <div className="flex items-center gap-1.5">
                  <Link
                    to={`/teacher/tests/${test._id}/analytics`}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-primary-50 text-slate-600 hover:text-primary-600 dark:bg-dark-800 transition-colors"
                    title="View Analytics"
                  >
                    <HiChartBar className="h-4 w-4" />
                  </Link>
                  <Link
                    to={`/teacher/tests/${test._id}/edit`}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-primary-50 text-slate-600 hover:text-primary-600 dark:bg-dark-800 transition-colors"
                    title="Edit Test"
                  >
                    <HiPencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDeleteTest(test._id, test.title)}
                    className="p-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-dark-800 transition-colors"
                    title="Delete Test"
                  >
                    <HiTrash className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════ TEST SERIES MODAL (CREATE / EDIT) ════════ */}
      {seriesModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-dark-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-900 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-dark-800 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-dark-800 mb-6">
              <div>
                <h3 className="text-lg font-bold text-dark-900 dark:text-white font-display">
                  {editingSeriesId ? 'Edit Test Series Package' : 'Create Test Series Package'}
                </h3>
                <p className="text-xs text-slate-500 font-normal">
                  Bundle mocks, drills, and previous year papers into a comprehensive package.
                </p>
              </div>
              <button
                onClick={() => setSeriesModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-dark-800 text-slate-600"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSeries} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Test Series Title *
                </label>
                <input
                  required
                  value={seriesForm.title}
                  onChange={(e) => {
                    const title = e.target.value;
                    const autoSlug = title
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/(^-|-$)/g, '');
                    setSeriesForm({
                      ...seriesForm,
                      title,
                      slug: editingSeriesId ? seriesForm.slug : autoSlug,
                    });
                  }}
                  placeholder="e.g. PGT Political Science Subject-Wise Target Test Series"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Target Exam Category *
                  </label>
                  <select
                    required
                    value={seriesForm.examCategory}
                    onChange={(e) => setSeriesForm({ ...seriesForm, examCategory: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white font-medium"
                  >
                    <option value="">-- Select Exam Category --</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Language / Medium
                  </label>
                  <select
                    value={seriesForm.language}
                    onChange={(e) => setSeriesForm({ ...seriesForm, language: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white font-medium"
                  >
                    <option value="Bilingual">Bilingual (English + Hindi)</option>
                    <option value="Hindi">Hindi Medium</option>
                    <option value="English">English Medium</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={seriesForm.description}
                  onChange={(e) => setSeriesForm({ ...seriesForm, description: e.target.value })}
                  placeholder="Overview of syllabus, chapter-wise drills, full mocks & previous year papers included..."
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 rounded-xl text-dark-900 dark:text-white leading-relaxed"
                />
              </div>

              {/* Specs Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-dark-800/60 border border-slate-100 dark:border-dark-700">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Total Tests
                  </label>
                  <input
                    type="number"
                    value={seriesForm.testsCount}
                    onChange={(e) => setSeriesForm({ ...seriesForm, testsCount: e.target.value })}
                    className="w-full px-2 py-1 text-xs font-bold bg-white dark:bg-dark-900 border rounded-lg text-dark-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Total Questions
                  </label>
                  <input
                    type="number"
                    value={seriesForm.questionsCount}
                    onChange={(e) =>
                      setSeriesForm({ ...seriesForm, questionsCount: e.target.value })
                    }
                    className="w-full px-2 py-1 text-xs font-bold bg-white dark:bg-dark-900 border rounded-lg text-dark-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Total Marks
                  </label>
                  <input
                    type="number"
                    value={seriesForm.totalMarks}
                    onChange={(e) => setSeriesForm({ ...seriesForm, totalMarks: e.target.value })}
                    className="w-full px-2 py-1 text-xs font-bold bg-white dark:bg-dark-900 border rounded-lg text-dark-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    value={seriesForm.duration}
                    onChange={(e) => setSeriesForm({ ...seriesForm, duration: e.target.value })}
                    className="w-full px-2 py-1 text-xs font-bold bg-white dark:bg-dark-900 border rounded-lg text-dark-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    MRP Price (₹)
                  </label>
                  <input
                    type="number"
                    value={seriesForm.price}
                    onChange={(e) => setSeriesForm({ ...seriesForm, price: e.target.value })}
                    placeholder="199"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-dark-800 border rounded-xl text-dark-900 dark:text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Discounted Offer Price (₹)
                  </label>
                  <input
                    type="number"
                    value={seriesForm.discountPrice}
                    onChange={(e) =>
                      setSeriesForm({ ...seriesForm, discountPrice: e.target.value })
                    }
                    placeholder="99"
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-dark-800 border rounded-xl text-dark-900 dark:text-white font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-dark-800">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={seriesForm.isFree}
                    onChange={(e) => setSeriesForm({ ...seriesForm, isFree: e.target.checked })}
                    className="rounded text-primary-600"
                  />
                  100% Free Series Pack
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSeriesModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingSeries}
                    className="px-6 py-2 rounded-xl text-xs font-semibold bg-primary-600 hover:bg-primary-700 text-white shadow-sm transition-all flex items-center gap-1.5"
                  >
                    {savingSeries ? (
                      'Saving...'
                    ) : (
                      <>
                        <HiCheckCircle className="h-4 w-4" />
                        {editingSeriesId ? 'Update Series' : 'Create Series'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
