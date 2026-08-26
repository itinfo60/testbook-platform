import { Link } from 'react-router-dom';
import { HiCalendar, HiUser, HiArrowNarrowRight, HiEye } from 'react-icons/hi';
import { format } from 'date-fns';

export default function BlogCard({ blog }) {
  const { title, slug, excerpt, coverImage, author, publishedAt, tags, views } = blog;

  return (
    <Link
      to={`/blog/${slug}`}
      className="group bg-white dark:bg-dark-900 rounded-[24px] overflow-hidden border border-dark-200/60 dark:border-dark-800 transition-all duration-300 shadow-sm hover:shadow-premium hover:-translate-y-1.5 flex flex-col h-full cursor-pointer"
    >
      {/* Image Container */}
      <div className="block relative aspect-[16/9] overflow-hidden shrink-0">
        <img
          src={coverImage?.url || '/images/placeholders/blog-placeholder.jpg'}
          alt={title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Tags */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {tags?.slice(0, 2).map((tag, i) => (
            <span
              key={i}
              className="px-3 py-1 bg-white/95 dark:bg-dark-900/95 backdrop-blur-md text-primary-700 dark:text-primary-400 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider text-dark-400 dark:text-dark-500 mb-3">
            <div className="flex items-center gap-1.5">
              <HiCalendar className="h-3.5 w-3.5" />
              <span>
                {publishedAt && !isNaN(new Date(publishedAt).getTime())
                  ? format(new Date(publishedAt), 'MMM dd, yyyy')
                  : 'Recently'}
              </span>
            </div>
            <div
              className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-semibold"
              title="Total Views"
            >
              <HiEye className="h-3.5 w-3.5 text-primary-500" />
              <span>{views || 0}</span>
            </div>
          </div>

          <h3 className="text-lg lg:text-xl font-black text-dark-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>

          <p className="text-dark-500 dark:text-dark-400 text-[13px] font-medium line-clamp-3 mb-6 leading-relaxed">
            {excerpt || 'Read the latest insights and updates from our community experts...'}
          </p>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-dashed border-dark-200 dark:border-dark-800 flex items-center justify-between gap-3 mt-auto">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 shrink-0">
              <HiUser className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold text-dark-700 dark:text-dark-300">
              {author?.name?.split(' ')[0] || 'Admin'}
            </span>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-black text-primary-600 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300">
            Read Article
            <HiArrowNarrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
