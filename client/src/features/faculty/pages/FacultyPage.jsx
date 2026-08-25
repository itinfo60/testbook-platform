import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  HiAcademicCap,
  HiStar,
  HiBookOpen,
  HiBadgeCheck,
  HiSearch,
  HiSparkles,
  HiExternalLink,
  HiChevronLeft,
  HiChevronRight,
  HiLink,
} from 'react-icons/hi';
import { FaYoutube, FaTelegram, FaTwitter, FaLinkedin, FaGlobe } from 'react-icons/fa';
import api from '@/services/api';
import LoadingSpinner from '@/components/common/LoadingSpinner';

const ITEMS_PER_PAGE = 20;

export default function FacultyPage() {
  const [facultyMembers, setFacultyMembers] = useState([]);
  const [stats, setStats] = useState({
    totalFaculty: 0,
    totalCourses: 0,
    totalStudents: 0,
    avgRating: 4.9,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchFaculties = async () => {
      try {
        const res = await api.get('/faculty');
        const list = res.data?.data?.faculty || res.data?.faculty || [];
        const apiStats = res.data?.data?.stats || res.data?.stats || {};
        setFacultyMembers(list);
        setStats({
          totalFaculty: apiStats.totalFaculty || list.length,
          totalCourses: apiStats.totalCourses || 0,
          totalStudents: apiStats.totalStudents || 0,
          avgRating: apiStats.avgRating || 4.9,
        });
      } catch (err) {
        console.error('Failed to fetch faculty directory:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFaculties();
  }, []);

  // Collect ONLY unique specializations entered across active faculty
  const availableSpecializations = useMemo(() => {
    const set = new Set();
    facultyMembers.forEach((fac) => {
      const specs = Array.isArray(fac.specialization) ? fac.specialization : [];
      specs.forEach((s) => {
        const clean = String(s).trim();
        if (clean) set.add(clean);
      });
    });
    return Array.from(set);
  }, [facultyMembers]);

  // Filtered faculty
  const filteredFaculty = useMemo(() => {
    return facultyMembers
      .filter((fac) => {
        const q = searchQuery.trim().toLowerCase();
        const matchSearch =
          q === '' ||
          fac.name?.toLowerCase().includes(q) ||
          fac.headline?.toLowerCase().includes(q) ||
          fac.designation?.toLowerCase().includes(q) ||
          fac.bio?.toLowerCase().includes(q) ||
          (fac.specialization &&
            fac.specialization.some((s) => String(s).toLowerCase().includes(q)));

        const matchSpec =
          selectedSpecialization === 'all' ||
          (fac.specialization && fac.specialization.includes(selectedSpecialization));

        return matchSearch && matchSpec;
      })
      .sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return (b.coursesCount || 0) - (a.coursesCount || 0);
      });
  }, [facultyMembers, searchQuery, selectedSpecialization]);

  // Reset to page 1 on filter or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSpecialization]);

  // Pagination calculation (20 per page)
  const totalPages = Math.ceil(filteredFaculty.length / ITEMS_PER_PAGE) || 1;
  const paginatedFaculty = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFaculty.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredFaculty, currentPage]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center bg-slate-50 dark:bg-dark-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-dark-950 min-h-screen py-12 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 text-primary-700 dark:text-primary-300 font-semibold uppercase tracking-wider text-xs bg-primary-50 dark:bg-primary-950/60 px-3.5 py-1.5 rounded-full border border-primary-200 dark:border-primary-800 mb-4">
            <HiAcademicCap className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            <span>Distinguished Faculty & Mentors</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
            Learn From Eminent Educators
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm mt-3 leading-relaxed">
            Gain mastery with subject matter specialists, former RPSC rankers, and seasoned academic
            professors dedicated to your competitive exam triumph.
          </p>

          {/* Real Source-of-Truth Metrics */}
          <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto mt-8 p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-xs">
            <div>
              <p className="text-xl sm:text-2xl font-bold text-primary-600 dark:text-primary-400 font-display">
                {stats.totalFaculty}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                Faculty Mentors
              </p>
            </div>
            <div className="border-x border-slate-100 dark:border-dark-800">
              <p className="text-xl sm:text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-display">
                {stats.totalCourses}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                Active Courses
              </p>
            </div>
            <div className="border-r border-slate-100 dark:border-dark-800">
              <p className="text-xl sm:text-2xl font-bold text-amber-500 font-display">
                {stats.totalStudents}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                Enrolled Students
              </p>
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-display">
                {stats.avgRating}/5
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-0.5">
                Average Rating
              </p>
            </div>
          </div>
        </div>

        {/* Search & Dynamic Specialization Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-xs">
          {/* Search Box with cleanly aligned search icon */}
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <HiSearch className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search faculty by name or subject..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-700 bg-slate-50 dark:bg-dark-800 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white dark:focus:bg-dark-900 transition-all shadow-xs"
            />
          </div>

          {/* Dynamic Specialization Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setSelectedSpecialization('all')}
              className={`text-xs px-3.5 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedSpecialization === 'all'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700'
              }`}
            >
              All
            </button>
            {availableSpecializations.map((spec) => (
              <button
                key={spec}
                type="button"
                onClick={() => setSelectedSpecialization(spec)}
                className={`text-xs px-3.5 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all cursor-pointer ${
                  selectedSpecialization === spec
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-dark-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-dark-700'
                }`}
              >
                {spec}
              </button>
            ))}
          </div>
        </div>

        {/* Faculty Grid */}
        {paginatedFaculty.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-dark-900 rounded-3xl border border-slate-200 dark:border-dark-800 p-8">
            <div className="h-16 w-16 bg-slate-100 dark:bg-dark-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <HiAcademicCap className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              No Faculty Found
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No faculty profiles match your search or specialization filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {paginatedFaculty.map((fac) => {
              const avatarUrl = fac.avatar?.url || fac.avatar;
              const links = fac.links || {};
              const facultyCourseLink = `/courses?search=${encodeURIComponent(fac.name)}`;

              return (
                <div
                  key={fac.id || fac._id}
                  className="bg-white dark:bg-dark-900 rounded-3xl border border-slate-200/90 dark:border-dark-800 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-6 sm:p-8 space-y-5">
                    {/* Top Header Row with Avatar & Big Name */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 pb-5 border-b border-slate-100 dark:border-dark-800">
                      {/* Avatar with association link */}
                      <Link
                        to={facultyCourseLink}
                        className="relative shrink-0 group"
                        title={`View all courses by ${fac.name}`}
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={fac.name}
                            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-primary-500/20 shadow-xs group-hover:scale-102 transition-transform"
                          />
                        ) : (
                          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary-100 dark:bg-primary-950/60 border-2 border-primary-500/20 shadow-xs flex items-center justify-center text-3xl font-bold text-primary-700 dark:text-primary-300 font-display group-hover:scale-102 transition-transform">
                            {fac.name?.charAt(0)}
                          </div>
                        )}
                        {fac.isVerified && (
                          <div
                            className="absolute -bottom-1 -right-1 bg-white dark:bg-dark-900 rounded-full p-0.5 shadow-xs"
                            title="Verified Faculty"
                          >
                            <HiBadgeCheck className="h-5 w-5 text-primary-600" />
                          </div>
                        )}
                      </Link>

                      {/* Name & Academic Credentials */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Link
                            to={facultyCourseLink}
                            className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-display tracking-tight hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          >
                            {fac.name}
                          </Link>
                          {fac.isFeatured && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                              <HiSparkles className="h-3 w-3" /> Featured Mentor
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-400 mt-1">
                          {fac.headline || fac.designation}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                          {fac.qualification && <span>{fac.qualification}</span>}
                          {fac.experience && (
                            <>
                              <span>•</span>
                              <span>{fac.experience}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="inline-flex items-center gap-0.5 text-amber-500 font-semibold">
                            <HiStar className="h-3 w-3 fill-current" /> {fac.rating || '5.0'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Specialization Tags strictly from teacher config */}
                    {fac.specialization && fac.specialization.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {fac.specialization.map((spec, idx) => (
                          <span
                            key={idx}
                            className="text-[11px] font-medium bg-slate-50 dark:bg-dark-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-dark-700/60"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bio */}
                    {fac.bio && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3">
                        {fac.bio}
                      </p>
                    )}

                    {/* Active Courses */}
                    {fac.courses && fac.courses.length > 0 && (
                      <div className="pt-4 border-t border-slate-100 dark:border-dark-800">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2.5 flex items-center gap-1.5">
                          <HiBookOpen className="h-4 w-4 text-primary-600" />
                          <span>Featured Courses by {fac.name}</span>
                        </p>
                        <div className="space-y-2">
                          {fac.courses.slice(0, 2).map((course) => (
                            <Link
                              key={course.id}
                              to={`/courses/${course.slug || course.id}`}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-dark-800/60 hover:bg-primary-50/50 dark:hover:bg-primary-950/30 border border-slate-100 dark:border-dark-800 transition-colors group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                {(course.thumbnail?.url || course.thumbnail) && (
                                  <img
                                    src={course.thumbnail?.url || course.thumbnail}
                                    alt={course.title}
                                    className="w-10 h-7 rounded-md object-cover flex-shrink-0"
                                  />
                                )}
                                <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                  {course.title}
                                </p>
                              </div>
                              <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 flex-shrink-0 flex items-center gap-0.5 ml-2">
                                Enroll <HiExternalLink className="h-3 w-3" />
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Social & Resource Links + Associate Link */}
                  <div className="px-6 sm:px-8 py-3.5 bg-slate-50/80 dark:bg-dark-800/40 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between gap-4">
                    {/* Social Channels */}
                    <div className="flex items-center gap-2">
                      {links.youtube && (
                        <a
                          href={links.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                          title="YouTube Channel"
                        >
                          <FaYoutube className="h-4 w-4" />
                        </a>
                      )}
                      {links.telegram && (
                        <a
                          href={links.telegram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-sky-500 transition-colors"
                          title="Telegram Community"
                        >
                          <FaTelegram className="h-4 w-4" />
                        </a>
                      )}
                      {links.twitter && (
                        <a
                          href={links.twitter}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors"
                          title="Twitter / X"
                        >
                          <FaTwitter className="h-4 w-4" />
                        </a>
                      )}
                      {links.linkedin && (
                        <a
                          href={links.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                          title="LinkedIn Profile"
                        >
                          <FaLinkedin className="h-4 w-4" />
                        </a>
                      )}
                      {links.website && (
                        <a
                          href={links.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-emerald-500 transition-colors"
                          title="Personal Website & Notes"
                        >
                          <FaGlobe className="h-4 w-4" />
                        </a>
                      )}
                    </div>

                    {/* Direct Associated Link */}
                    <Link
                      to={facultyCourseLink}
                      className="text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 inline-flex items-center gap-1 group"
                    >
                      <HiLink className="w-3.5 h-3.5" />
                      <span>All Courses by {fac.name.split(' ')[0]}</span>
                      <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Bar (20 faculty per page) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 shadow-xs">
            <p className="text-xs text-slate-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredFaculty.length)} of{' '}
              {filteredFaculty.length} educators
            </p>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-slate-200 dark:border-dark-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-dark-800 text-xs font-medium transition-colors"
              >
                <HiChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    currentPage === pageNum
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-slate-200 dark:border-dark-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-dark-800 text-xs font-medium transition-colors"
              >
                <HiChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
