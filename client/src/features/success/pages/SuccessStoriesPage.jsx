import { Link } from 'react-router-dom';
import { HiBadgeCheck, HiStar, HiCheckCircle, HiAcademicCap } from 'react-icons/hi';

export default function SuccessStoriesPage() {
  const successStories = [
    {
      id: 1,
      name: 'Pooja Choudhary',
      exam: 'RPSC Assistant Professor (Political Science)',
      rank: 'Rank 04',
      year: '2023 Batch',
      quote:
        'Dr. Choudhary’s Political Science notes and test series were crucial for my Paper 1 & Paper 2 revision. The depth in Western Political Thought is unmatched.',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300',
    },
    {
      id: 2,
      name: 'Rakesh Verma',
      exam: 'RPSC EO & RO Exam',
      rank: 'Selected EO',
      year: '2023 Batch',
      quote:
        'Part-B Municipality Act 2009 tricks provided in the Target Batch allowed me to score 38/40 in Part-B. Highly recommended for every serious RPSC aspirant.',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300',
    },
    {
      id: 3,
      name: 'Sunita Sharma',
      exam: 'RPSC 1st Grade Teacher (Political Science)',
      rank: 'Rank 12',
      year: '2022 Batch',
      quote:
        'Regular mock tests and real-time rank comparison helped me identify my weak topics in Comparative Politics. EduPortal is a game changer!',
      image: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300',
    },
    {
      id: 4,
      name: 'Vikram Singh Shekhawat',
      exam: 'RPSC RAS Exam',
      rank: 'Selected Tehsildar (RTS)',
      year: '2021 Batch',
      quote:
        'The watermarked handwritten notes and Rajasthan Polity strategy sessions gave me the edge in RAS Mains Paper III. Thank you EduPortal team!',
      image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300',
    },
  ];

  return (
    <div className="bg-dark-50 dark:bg-dark-950 min-h-screen py-10 px-4 sm:px-6 lg:px-8 text-dark-900 dark:text-dark-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider text-xs bg-amber-50 dark:bg-amber-950 px-3 py-1 rounded-full mb-3">
            <HiBadgeCheck className="h-4 w-4" /> Hall of Fame
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold font-display">
            Our Selected Toppers & Success Stories
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base mt-2">
            Real stories from authentic aspirants who achieved top ranks in RPSC RAS, Assistant
            Professor & Teacher recruitment exams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {successStories.map((story) => (
            <div
              key={story.id}
              className="bg-white dark:bg-dark-900 rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200 dark:border-dark-800 flex flex-col sm:flex-row gap-6 items-center sm:items-start"
            >
              <img
                src={story.image}
                alt={story.name}
                className="w-24 h-24 rounded-2xl object-cover shrink-0 border-2 border-amber-500 shadow-md"
              />

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="text-xl font-extrabold text-dark-900 dark:text-white">
                    {story.name}
                  </h3>
                  <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-amber-500 text-white">
                    🏆 {story.rank}
                  </span>
                </div>

                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mb-2">
                  {story.exam} ({story.year})
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed mb-4">
                  "{story.quote}"
                </p>

                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-semibold">
                  <HiCheckCircle className="h-4 w-4" /> Verified EduPortal Student
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
