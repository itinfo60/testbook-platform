import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBlogBySlug, clearCurrentBlog } from '../blogSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { HiCalendar, HiUser, HiArrowLeft, HiShare, HiHashtag } from 'react-icons/hi';
import { format } from 'date-fns';

export default function BlogDetail() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const { currentBlog, loading, error } = useSelector(state => state.blogs);

  useEffect(() => {
    dispatch(fetchBlogBySlug(slug));
    return () => dispatch(clearCurrentBlog());
  }, [dispatch, slug]);

  if (loading) return <LoadingSpinner fullScreen />;
  
  if (error || !currentBlog) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-bold text-dark-900 dark:text-white mb-4">Post not found</h2>
        <Link to="/blog" className="text-primary-600 font-bold hover:underline flex items-center gap-2">
          <HiArrowLeft /> Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <article className="min-h-screen bg-white dark:bg-dark-950 pb-20">
      {/* Hero Section */}
      <div className="relative h-[400px] md:h-[500px] w-full">
        <img
          src={currentBlog.coverImage?.url || '/images/placeholders/blog-placeholder.jpg'}
          alt={currentBlog.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <div className="max-w-4xl mx-auto">
            <Link to="/blog" className="inline-flex items-center gap-2 text-primary-400 font-bold mb-6 hover:text-primary-300 transition-colors">
              <HiArrowLeft /> Back to Insights
            </Link>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight font-display">
              {currentBlog.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-dark-300">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold border-2 border-primary-500/50">
                  {currentBlog.author?.name?.charAt(0)}
                </div>
                <div>
                  <p className="text-white font-bold leading-none">{currentBlog.author?.name || 'Admin'}</p>
                  <p className="text-xs mt-1">Author</p>
                </div>
              </div>
              <div className="flex items-center gap-2 h-10 px-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                <HiCalendar className="h-4 w-4 text-primary-400" />
                <span className="text-sm">{currentBlog.publishedAt ? format(new Date(currentBlog.publishedAt), 'MMMM dd, yyyy') : 'Recently'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-4xl mx-auto px-6 mt-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content */}
          <div className="flex-1">
            <div 
              className="prose prose-lg dark:prose-invert max-w-none prose-primary
                prose-headings:font-display prose-headings:font-bold
                prose-p:text-dark-600 dark:prose-p:text-dark-300
                prose-a:text-primary-600 dark:prose-a:text-primary-400
                prose-img:rounded-3xl prose-img:shadow-2xl"
              dangerouslySetInnerHTML={{ __html: currentBlog.content }}
            />
            
            <div className="mt-16 pt-8 border-t border-dark-100 dark:border-dark-800 flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-wrap gap-2">
                {currentBlog.tags?.map(tag => (
                  <span key={tag} className="flex items-center gap-1 px-4 py-2 bg-dark-50 dark:bg-dark-900 text-dark-600 dark:text-dark-400 rounded-xl text-sm font-medium">
                    <HiHashtag className="text-primary-500" />
                    {tag}
                  </span>
                ))}
              </div>
              <button className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-primary-500/20 active:scale-95">
                <HiShare className="h-5 w-5" />
                Share Article
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
