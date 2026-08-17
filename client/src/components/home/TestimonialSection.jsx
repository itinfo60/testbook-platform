import { useState, useEffect } from 'react';
import RatingStars from '@/components/common/RatingStars';
import api from '@/services/api';

export default function TestimonialSection() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await api.get('/reviews/testimonials');
        setTestimonials(res.data?.data || []);
      } catch (error) {
        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  const next = () => setCurrent((current + 1) % testimonials.length);
  const prev = () => setCurrent((current - 1 + testimonials.length) % testimonials.length);

  if (!loading && testimonials.length === 0) return null;

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="section-title">What Our Students Say</h2>
          <p className="section-subtitle">Success stories from our community</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {loading
            ? Array(4)
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="card p-6 animate-pulse">
                    <div className="h-4 bg-slate-200 dark:bg-dark-700 rounded w-24 mb-4"></div>
                    <div className="h-3 bg-slate-200 dark:bg-dark-700 rounded w-full mb-2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-dark-700 rounded w-full mb-2"></div>
                    <div className="h-3 bg-slate-200 dark:bg-dark-700 rounded w-2/3 mb-4"></div>
                    <div className="flex items-center gap-3 pt-3 border-t border-dark-100 dark:border-dark-700">
                      <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-dark-700"></div>
                      <div>
                        <div className="h-3 bg-slate-200 dark:bg-dark-700 rounded w-20 mb-1.5"></div>
                        <div className="h-2 bg-slate-200 dark:bg-dark-700 rounded w-16"></div>
                      </div>
                    </div>
                  </div>
                ))
            : testimonials.map((t, i) => (
                <div key={i} className="card p-6">
                  <RatingStars rating={t.rating} size="sm" showValue={false} />
                  <p className="text-sm text-dark-600 dark:text-dark-400 mt-3 mb-4 line-clamp-3">
                    {t.text || t.comment}
                  </p>
                  <div className="flex items-center gap-3 pt-3 border-t border-dark-100 dark:border-dark-700">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-semibold">
                      {t.avatar || t.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-dark-900 dark:text-white">
                        {t.name || t.user?.name}
                      </div>
                      <div className="text-xs text-dark-400">{t.exam || 'Student'}</div>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
