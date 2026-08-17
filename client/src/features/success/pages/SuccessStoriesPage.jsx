import { Link } from 'react-router-dom';
import { HiBadgeCheck, HiStar, HiCheckCircle, HiAcademicCap } from 'react-icons/hi';

export default function SuccessStoriesPage() {
  const successStories = [];

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

        {successStories.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-dark-900 rounded-3xl border border-dashed border-slate-200 dark:border-dark-800 shadow-sm">
            <div className="h-20 w-20 mx-auto bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-5 text-4xl">
              🎓
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-dark-900 dark:text-white mb-3">
              More success stories coming soon!
            </h3>
            <p className="text-slate-500 max-w-md mx-auto text-sm sm:text-base">
              Our students are working hard to achieve their dreams. Check back later to read their
              inspiring journeys.
            </p>
          </div>
        ) : (
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
                    <HiCheckCircle className="h-4 w-4" /> Verified CivicsEdu Student
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
