import { Link } from 'react-router-dom';
import { HiCalendar, HiUser, HiArrowNarrowRight } from 'react-icons/hi';
import { format } from 'date-fns';

export default function BlogCard({ blog }) {
  const { title, slug, excerpt, coverImage, author, publishedAt, tags } = blog;

  return (
    <div className="group bg-white dark:bg-dark-800 rounded-3xl overflow-hidden border border-dark-100 dark:border-dark-700 hover:border-primary-500/50 dark:hover:border-primary-500/50 transition-all duration-300 shadow-sm hover:shadow-xl hover:-translate-y-1">
      {/* Image Container */}
      <Link to={`/blog/${slug}`} className="block relative aspect-[16/10] overflow-hidden">
        <img
          src={coverImage?.url || '/images/placeholders/blog-placeholder.jpg'}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Tags */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2">
          {tags?.slice(0, 2).map((tag, i) => (
            <span key={i} className="px-3 py-1 bg-white/90 dark:bg-dark-900/90 backdrop-blur-md text-primary-600 dark:text-primary-400 text-[10px] font-bold uppercase tracking-wider rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </Link>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center gap-4 text-xs text-dark-400 mb-3">
          <div className="flex items-center gap-1.5">
            <HiCalendar className="h-3.5 w-3.5" />
            <span>{publishedAt ? format(new Date(publishedAt), 'MMM dd, yyyy') : 'Recently'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <HiUser className="h-3.5 w-3.5" />
            <span>{author?.name?.split(' ')[0] || 'Admin'}</span>
          </div>
        </div>

        <Link to={`/blog/${slug}`}>
          <h3 className="text-xl font-bold text-dark-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2 leading-tight">
            {title}
          </h3>
        </Link>
        
        <p className="text-dark-500 dark:text-dark-400 text-sm line-clamp-3 mb-6 leading-relaxed">
          {excerpt || 'Read the latest insights and updates from our community experts...'}
        </p>

        <Link
          to={`/blog/${slug}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-primary-600 dark:text-primary-400 group/btn"
        >
          Read Article
          <HiArrowNarrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </div>
  );
}
