import { useState } from 'react';
import RatingStars from '@/components/common/RatingStars';

const testimonials = [
  {
    name: 'Priya Sharma',
    exam: 'SBI PO',
    rating: 5,
    text: 'LearnHub helped me crack SBI PO in my first attempt! The test series and mock tests were incredibly helpful.',
    avatar: 'PS',
  },
  {
    name: 'Rahul Kumar',
    exam: 'SSC CGL',
    rating: 5,
    text: 'The best platform for SSC preparation. The quality of content and the test analysis feature is outstanding.',
    avatar: 'RK',
  },
  {
    name: 'Anita Verma',
    exam: 'IBPS Clerk',
    rating: 4,
    text: 'I love the structured approach and detailed solutions. The teachers are excellent and always helpful.',
    avatar: 'AV',
  },
  {
    name: 'Mohit Singh',
    exam: 'RRB NTPC',
    rating: 5,
    text: 'Affordable and comprehensive. The mock tests mirror the actual exam pattern perfectly.',
    avatar: 'MS',
  },
];

export default function TestimonialSection() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((current + 1) % testimonials.length);
  const prev = () => setCurrent((current - 1 + testimonials.length) % testimonials.length);

  return (
    <section className="py-12 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-10">
          <h2 className="section-title">What Our Students Say</h2>
          <p className="section-subtitle">Success stories from our community</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="card p-6">
              <RatingStars rating={t.rating} size="sm" showValue={false} />
              <p className="text-sm text-dark-600 dark:text-dark-400 mt-3 mb-4 line-clamp-3">{t.text}</p>
              <div className="flex items-center gap-3 pt-3 border-t border-dark-100 dark:border-dark-700">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-sm font-semibold">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-medium text-dark-900 dark:text-white">{t.name}</div>
                  <div className="text-xs text-dark-400">Cleared {t.exam}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
