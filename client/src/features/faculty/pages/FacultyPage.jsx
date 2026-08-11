import { Link } from 'react-router-dom';
import { HiAcademicCap, HiStar, HiBookOpen, HiUserGroup, HiBadgeCheck } from 'react-icons/hi';

export default function FacultyPage() {
  const facultyMembers = [
    {
      id: 'f1',
      name: 'Dr. Choudhary',
      subject: 'Political Science (Assistant Professor & PGT Specialist)',
      experience: '12+ Years Experience',
      qualification: 'Ph.D. in Political Science, NET-JRF, Former Asst. Professor',
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      bio: 'Author of 3 renowned books on Indian Constitution & Comparative Politics. Trained 1,000+ candidates selected in RPSC, UPHESC & KVS.',
      coursesCount: 5,
      rating: 5.0,
    },
    {
      id: 'f2',
      name: 'Prof. Sharma',
      subject: 'Rajasthan GK, EO/RO Part-B & Administrative Law',
      experience: '10+ Years Experience',
      qualification: 'M.A. Public Administration, Gold Medalist, RPSC Interviewee',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
      bio: 'Master of Rajasthan Municipalities Act 2009. Known for unique mnemonic memory tricks and high-yield test series development.',
      coursesCount: 4,
      rating: 4.9,
    },
    {
      id: 'f3',
      name: 'Vikram Sir',
      subject: 'RAS Geography, Economy & Current Affairs',
      experience: '8+ Years Experience',
      qualification: 'M.Sc. Geography, RAS Mains Qualifier (Multiple Times)',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
      bio: 'Specialist in Rajasthan Economy, Survey Reports & Administrative Setup for RAS Prelims and Mains.',
      coursesCount: 3,
      rating: 4.8,
    },
    {
      id: 'f4',
      name: 'Dr. Anjali Mehta',
      subject: 'Western Political Thought & International Relations',
      experience: '9+ Years Experience',
      qualification: 'Ph.D., UGC NET JRF',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400',
      bio: 'Expert lecturer on Classical & Modern Western Political Thinkers. Simplifies complex theories with structured flowchart notes.',
      coursesCount: 3,
      rating: 4.9,
    },
  ];

  return (
    <div className="bg-dark-50 dark:bg-dark-950 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-dark-900 dark:text-dark-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-xs bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded-full mb-3">
            <HiAcademicCap className="h-4 w-4" /> Expert Mentors
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display">
            Meet Our Faculty Members
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
            Learn from top academicians, subject experts, and RPSC rank holders with decades of
            combined experience in competitive exam guidance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {facultyMembers.map((fac) => (
            <div
              key={fac.id}
              className="bg-white dark:bg-dark-900 rounded-3xl p-6 sm:p-8 shadow-md hover:shadow-xl border border-slate-200 dark:border-dark-800 transition-all flex flex-col sm:flex-row gap-6 items-center sm:items-start"
            >
              <img
                src={fac.image}
                alt={fac.name}
                className="w-32 h-32 rounded-2xl object-cover shrink-0 border-2 border-amber-500 shadow-md"
              />

              <div className="flex-1 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2 mb-1">
                  <h3 className="text-xl font-extrabold text-dark-900 dark:text-white">
                    {fac.name}
                  </h3>
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2.5 py-1 rounded-full">
                    ⭐ {fac.rating}
                  </span>
                </div>

                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-1">
                  {fac.subject}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                  {fac.qualification} • {fac.experience}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  {fac.bio}
                </p>

                <div className="pt-3 border-t border-slate-100 dark:border-dark-800 flex items-center justify-between">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
                    📚 {fac.coursesCount} Active Batches
                  </span>
                  <Link
                    to="/courses"
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:underline"
                  >
                    View Batches →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
