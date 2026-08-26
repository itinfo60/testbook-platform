import { Link } from 'react-router-dom';
import {
  HiArrowRight,
  HiClipboardList,
  HiClock,
  HiDocumentText,
  HiQuestionMarkCircle,
  HiSparkles,
} from 'react-icons/hi';

export default function TestSeriesCard({ series }) {
  const {
    _id,
    id,
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
    full_length: 'Full Length Series',
    subject_wise: 'Subject-Wise',
    topic_wise: 'Chapter / Topic',
    pyq: 'PYQ Papers',
    daily: 'Daily Practice',
    sectional: 'Sectional Tests',
  };

  const finalPrice = Number(price) || 0;

  return (
    <Link
      to={`/test-series/${slug || id || _id}`}
      className="bg-white dark:bg-dark-900 rounded-[24px] p-5 sm:p-6 border border-dark-200/60 dark:border-dark-800 shadow-sm hover:shadow-premium hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden h-full cursor-pointer"
    >
      {isFeatured && (
        <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-black px-4 py-1.5 rounded-bl-[20px] uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
          <HiSparkles className="h-3 w-3" /> Featured
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {/* Badges Row */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {examCategory && (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase bg-dark-50 dark:bg-dark-800 text-dark-600 dark:text-dark-300 border border-dark-200/50 dark:border-dark-700/50">
              {typeof examCategory === 'object' ? examCategory.name : examCategory}
            </span>
          )}
          {testType && (
            <span className="px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest uppercase bg-primary-50/80 dark:bg-primary-950/40 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-900/50">
              {typeLabels[testType] || testType}
            </span>
          )}
          {language && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-dark-50 dark:bg-dark-800 text-dark-500 dark:text-dark-400">
              {language}
            </span>
          )}
        </div>

        {/* Title & Desc */}
        <h3 className="text-lg sm:text-xl font-black text-dark-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 leading-snug">
          {title}
        </h3>

        {description && (
          <p className="text-xs sm:text-[13px] font-medium text-dark-500 dark:text-dark-400 line-clamp-2 mb-5 leading-relaxed flex-1">
            {description}
          </p>
        )}

        {/* Stats Strip */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-dark-500 dark:text-dark-400 mb-6 bg-dark-50 dark:bg-dark-950 p-3 rounded-2xl border border-dark-100 dark:border-dark-800 mt-auto">
          <div className="flex items-center gap-1.5">
            <HiDocumentText className="h-4 w-4 text-primary-500" />
            <span>{testsCount || 10} Tests</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HiQuestionMarkCircle className="h-4 w-4 text-emerald-500" />
            <span>{questionsCount || 1000}+ Qs</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-dashed border-dark-200 dark:border-dark-800 flex items-center justify-between gap-3 mt-auto">
        <div>
          {isFree || finalPrice === 0 ? (
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              Free Access
            </span>
          ) : (
            <div className="flex flex-col">
              {discountPrice > finalPrice && (
                <span className="text-[10px] font-bold text-dark-400 line-through">
                  ₹{discountPrice}
                </span>
              )}
              <span className="text-base font-black text-dark-900 dark:text-white">
                ₹{finalPrice}
              </span>
            </div>
          )}
        </div>

        <span className="bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 group-hover:bg-primary-600 group-hover:text-white dark:group-hover:bg-primary-500 dark:group-hover:text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all inline-flex items-center gap-1.5">
          <span>View Series</span>
          <HiArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );
}
