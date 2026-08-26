import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { libraryAPI } from '@/services/api';
import { HiArrowRight, HiOutlineDownload } from 'react-icons/hi';

export default function FreeResources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await libraryAPI.getFreeResources({ limit: 5 });
        if (response.data?.data?.resources) {
          const mapped = response.data.data.resources.map((r) => {
            // Assign a random color style
            const styles = [
              { color: 'text-blue-600', bg: 'bg-blue-50' },
              { color: 'text-purple-600', bg: 'bg-purple-50' },
              { color: 'text-orange-600', bg: 'bg-orange-50' },
              { color: 'text-green-600', bg: 'bg-green-50' },
              { color: 'text-red-600', bg: 'bg-red-50' },
            ];
            const randStyle = styles[Math.floor(Math.random() * styles.length)];
            return {
              ...r,
              type: r.category?.name || 'Resource',
              desc: r.description || 'Download this free resource for your exam preparation.',
              ...randStyle,
            };
          });
          setResources(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch free resources', error);
      } finally {
        setLoading(false);
      }
    };
    fetchResources();
  }, []);

  return (
    <section className="py-20 bg-[#faf9f6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Top Link */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="text-xs font-black uppercase tracking-widest text-accent-600 mb-2">
              Free Study Vault
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-extrabold text-navy-950 tracking-tight">
              Start Free. Learn Something Today.
            </h2>
            <p className="text-base sm:text-lg text-navy-600 mt-2">
              Free download solved PYQs, syllabus copies, mind maps, and state current affairs PDFs.
            </p>
          </div>

          <Link
            to="/free-resources"
            className="inline-flex items-center gap-2 text-sm sm:text-base font-bold text-navy-950 hover:text-accent-600 transition-colors border-b-2 border-navy-200 hover:border-accent-600 pb-1 whitespace-nowrap self-start md:self-auto"
          >
            View All Free Resources <HiArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {resources.length === 0 && !loading ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-navy-100">
            <h3 className="text-xl font-bold text-navy-900">No free resources available</h3>
            <p className="text-navy-600 mt-2">
              Check back later for newly added PYQs, PDFs, and mind maps.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
            {resources.map((resource) => (
              <Link
                key={resource._id || resource.id}
                to="/free-resources"
                className="bg-white rounded-3xl p-6 border border-navy-100 hover:border-navy-300 hover:shadow-xl hover:-translate-y-1 transition-all shadow-sm flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-3 w-fit ${resource.bg} ${resource.color}`}
                  >
                    {resource.type}
                  </span>
                  <h3 className="text-base font-bold text-navy-950 mb-2 line-clamp-2">
                    {resource.title}
                  </h3>
                  <p className="text-navy-600 text-xs mb-4 line-clamp-2 leading-relaxed">
                    {resource.desc}
                  </p>
                </div>

                <span className="flex items-center justify-center gap-2 text-xs font-bold text-navy-900 bg-navy-50 hover:bg-navy-100 group-hover:text-accent-600 transition-colors py-2 px-3 rounded-xl border border-navy-100 mt-auto">
                  <HiOutlineDownload className="h-4 w-4" /> Download PDF
                </span>
              </Link>
            ))}
          </div>
        )}

        {/* Bottom View All Button */}
        <div className="mt-12 text-center">
          <Link
            to="/free-resources"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white hover:bg-navy-50 text-navy-950 border border-navy-200 hover:border-navy-300 rounded-full font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all"
          >
            View All Free Resources ({resources.length}+){' '}
            <HiArrowRight className="h-4 w-4 text-accent-500" />
          </Link>
        </div>
      </div>
    </section>
  );
}
