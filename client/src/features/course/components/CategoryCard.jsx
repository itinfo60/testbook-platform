import { Link } from 'react-router-dom';
import { HiArrowRight } from 'react-icons/hi';

const categoryIcons = {
  'Banking': '🏦',
  'SSC': '🏛️',
  'Railways': '🚂',
  'UPSC': '📜',
  'State PSC': '🏢',
  'Teaching': '📖',
  'Defence': '🎖️',
  'Engineering': '⚙️',
  'Medical': '🩺',
  'Law': '⚖️',
  'MBA': '📊',
  'Programming': '💻',
};

export default function CategoryCard({ category }) {
  const icon = categoryIcons[category.name] || '📂';

  return (
    <Link
      to={`/categories/${category._id || category.slug}`}
      className="card-hover p-6 group text-center"
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-semibold text-dark-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
        {category.name}
      </h3>
      {category.courseCount !== undefined && (
        <p className="text-sm text-dark-400">{category.courseCount} courses</p>
      )}
      <div className="mt-3 flex items-center justify-center gap-1 text-sm text-primary-600 dark:text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity">
        Explore <HiArrowRight className="h-3.5 w-3.5" />
      </div>
    </Link>
  );
}
