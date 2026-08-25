import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiSearch,
  HiX,
  HiAcademicCap,
  HiArrowRight,
  HiArrowLeft,
  HiClipboardList,
  HiQuestionMarkCircle,
  HiSparkles,
} from 'react-icons/hi';
import api from '@/services/api';

export default function ExamSelectionModal({ isOpen, onClose, categories = [] }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedExam, setSelectedExam] = useState(null);
  const [examPackages, setExamPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSelectedExam(null);
      setExamPackages([]);
      setSearch('');
    }
  }, [isOpen]);

  const handleSelectExam = async (exam) => {
    setSelectedExam(exam);
    try {
      setLoadingPackages(true);
      const res = await api.get('/test-series', {
        params: { examCategory: exam._id, limit: 20 },
      });
      const list = res.data?.data?.testSeries || res.data?.testSeries || [];
      setExamPackages(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch packages for exam', err);
    } finally {
      setLoadingPackages(false);
    }
  };

  const handleSelectPackage = (series) => {
    onClose();
    navigate(`/test-series/${series.slug}`);
  };

  if (!isOpen) return null;

  // Flatten subcategories (Exams)
  const allExams = categories.flatMap((cat) => {
    if (cat.subcategories && cat.subcategories.length > 0) {
      return cat.subcategories.map((sub) => ({ ...sub, parentName: cat.name }));
    }
    return [{ ...cat, parentName: 'State Exams' }];
  });

  const filteredExams = allExams.filter((exam) => {
    const matchesSearch =
      !search ||
      exam.name?.toLowerCase().includes(search.toLowerCase()) ||
      exam.description?.toLowerCase().includes(search.toLowerCase());

    const matchesTab =
      activeTab === 'all' ||
      (activeTab === 'rajasthan' &&
        (exam.slug?.includes('rpsc') ||
          exam.slug?.includes('rajasthan') ||
          exam.slug?.includes('patwari') ||
          exam.slug?.includes('ras') ||
          exam.slug?.includes('vdo'))) ||
      (activeTab === 'polity' && (exam.slug?.includes('professor') || exam.slug?.includes('pgt')));

    return matchesSearch && matchesTab;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {selectedExam && (
              <button
                onClick={() => setSelectedExam(null)}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <HiArrowLeft className="h-5 w-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <HiAcademicCap className="h-6 w-6 text-amber-800" />
                {selectedExam
                  ? `${selectedExam.name} — Test Series Packages`
                  : 'Select Your Target Competitive Exam'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                {selectedExam
                  ? 'Choose from available Mock Test Series, PYP Papers, Subject & Chapter Series'
                  : 'Access full mock series, PYP papers, and subject target packages'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-600 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors cursor-pointer"
          >
            <HiX className="h-6 w-6" />
          </button>
        </div>

        {!selectedExam ? (
          /* Step 1: Exam Selection View */
          <>
            {/* Search & Category Filter Pills */}
            <div className="p-6 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 space-y-4">
              <div className="relative">
                <HiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 h-5 w-5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search target exam (e.g. Patwari, RAS, RPSC SI, Assistant Professor)..."
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {[
                  { id: 'all', label: 'All Competitive Exams' },
                  { id: 'rajasthan', label: '🏛️ Rajasthan State Exams' },
                  { id: 'polity', label: '🎓 Political Science & Higher Edu' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === t.id
                        ? 'bg-amber-800 text-white shadow-md'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Exam Cards Grid */}
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
              {filteredExams.length === 0 ? (
                <div className="text-center py-12 text-slate-600 text-sm">
                  No exams found matching your search.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredExams.map((exam) => (
                    <div
                      key={exam.id || exam._id}
                      onClick={() => handleSelectExam(exam)}
                      className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-750 hover:border-amber-500 dark:hover:border-amber-500 shadow-sm hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            {exam.parentName || 'State Exam'}
                          </span>
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                            4 Test Series Packages
                          </span>
                        </div>

                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
                          {exam.name}
                        </h3>
                        {exam.description && (
                          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                            {exam.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                        <span>55 Total Tests • Official PYPs</span>
                        <span className="text-amber-800 dark:text-amber-400 font-extrabold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                          Select Exam <HiArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Step 2: Multiple Test Series Packages View for Selected Exam */
          <div className="p-6 overflow-y-auto max-h-[70vh]">
            {loadingPackages ? (
              <div className="py-16 text-center text-slate-600">
                Loading test series packages...
              </div>
            ) : examPackages.length === 0 ? (
              <div className="text-center py-16 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                <div className="text-4xl mb-3">📝</div>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                  No packages available for {selectedExam.name}
                </h3>
                <button
                  onClick={() => handleSelectExam(selectedExam)}
                  className="text-xs text-amber-800 font-bold hover:underline"
                >
                  Reload Packages
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {examPackages.map((series) => (
                  <div
                    key={series.id || series._id}
                    className="bg-white dark:bg-slate-800/80 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          {series.testType?.replace('_', ' ').toUpperCase() || 'SERIES PACKAGE'}
                        </span>
                        {series.isFree && (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                            Free Package
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-2 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors">
                        {series.title}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 mb-4 leading-relaxed">
                        {series.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl mb-4">
                        <span className="flex items-center gap-1">
                          <HiClipboardList className="h-4 w-4 text-amber-800" />{' '}
                          {series.testsCount || 15} Tests
                        </span>
                        <span className="flex items-center gap-1">
                          <HiQuestionMarkCircle className="h-4 w-4 text-blue-500" />{' '}
                          {series.questionsCount || 500}+ Qs
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                      <div>
                        {series.isFree || series.price === 0 ? (
                          <span className="text-sm font-black text-emerald-600">FREE</span>
                        ) : (
                          <span className="text-lg font-black text-slate-900 dark:text-white">
                            ₹{series.price}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleSelectPackage(series)}
                        className="bg-amber-800 hover:bg-amber-900 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <span>View Series</span>
                        <HiArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
