import { Link } from 'react-router-dom';
import {
  HiClipboardList,
  HiClock,
  HiQuestionMarkCircle,
  HiArrowRight,
  HiSparkles,
} from 'react-icons/hi';

export default function TestSeriesCard({ series }) {
  const {
    _id,
    title,
    slug,
    description,
    examCategory,
    testType,
    testsCount,
    questionsCount,
    duration,
    isFree,
    price,
    discountPrice,
    isFeatured,
    language,
  } = series;

  const typeLabels = {
    full_length: '🏆 Full Length Series',
    subject_wise: '📚 Subject-Wise',
    topic_wise: '📖 Chapter / Topic',
    pyq: '📜 PYQ Papers',
    daily: '⚡ Daily Practice',
    sectional: '📐 Sectional Tests',
  };

  const finalPrice = Number(price) || 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all flex flex-col justify-between group relative overflow-hidden">
      {isFeatured && (
        <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
          <HiSparkles className="h-3 w-3" /> Featured
        </div>
      )}

      <div>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {examCategory && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {typeof examCategory === 'object' ? examCategory.name : examCategory}
            </span>
          )}
          {testType && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
              {typeLabels[testType] || testType}
            </span>
          )}
          {language && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900">
              {language}
            </span>
          )}
        </div>

        <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
          {title}
        </h3>

        {description && (
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
            {description}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
          <div className="flex items-center gap-1.5">
            <HiClipboardList className="h-4 w-4 text-amber-500" />
            <span>{testsCount || 10} Tests</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HiQuestionMarkCircle className="h-4 w-4 text-blue-500" />
            <span>{questionsCount || 1000}+ Qs</span>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <div>
          {isFree || finalPrice === 0 ? (
            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
              Free Package
            </span>
          ) : (
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-slate-900 dark:text-white">
                ₹{finalPrice}
              </span>
              {discountPrice > finalPrice && (
                <span className="text-xs text-slate-400 line-through">₹{discountPrice}</span>
              )}
            </div>
          )}
        </div>

        <Link
          to={`/test-series/${slug || _id}`}
          className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-4 py-2.5 rounded-xl shadow-sm text-xs sm:text-sm transition-all inline-flex items-center gap-1.5"
        >
          <span>View Series</span>
          <HiArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
