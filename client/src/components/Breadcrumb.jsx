import { HiChevronRight, HiHome } from 'react-icons/hi';
import { Link } from 'react-router-dom';
/**
 * Breadcrumb — reusable breadcrumb navigation component
 *
 * Props:
 *  items   Array<{ label: string, href?: string }>
 *          Pass href for all items except the last (current page).
 *
 * Example:
 *    { label: 'Courses', href: '/courses' },
 *    { label: 'RAS Mains Batch 2026' },
 *  ]} />
 */
export default function Breadcrumb({ items = [], theme = 'light' }) {
  const allItems = [{ label: 'Home', href: '/' }, ...items];

  // Build JSON-LD BreadcrumbList
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allItems.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.label,
      ...(item.href ? { item: `https://edurportal.in${item.href}` } : {}),
    })),
  };

  return (
    <>
      {/* JSON-LD */}
      <script type="application/ld+json" suppressHydrationWarning>
        {JSON.stringify(jsonLd)}
      </script>

      <nav
        aria-label="Breadcrumb"
        className={`flex items-center flex-wrap gap-1 text-[13px] mb-6 ${theme === 'dark' ? 'text-blue-200/70' : 'text-slate-600 dark:text-slate-400'}`}
      >
        {allItems.map((item, idx) => {
          const isLast = idx === allItems.length - 1;
          return (
            <span key={idx} className="flex items-center gap-1">
              {idx === 0 && (
                <HiHome
                  className={`h-3.5 w-3.5 flex-shrink-0 ${theme === 'dark' ? 'text-blue-300' : 'text-slate-400'}`}
                />
              )}
              {isLast ? (
                <span
                  className={`font-semibold truncate max-w-[200px] sm:max-w-none ${theme === 'dark' ? 'text-white' : 'text-dark-900 dark:text-white'}`}
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className={`transition-colors truncate max-w-[120px] sm:max-w-none ${theme === 'dark' ? 'hover:text-white' : 'hover:text-primary-600 dark:hover:text-primary-400'}`}
                >
                  {item.label}
                </Link>
              )}
              {!isLast && (
                <HiChevronRight
                  className={`h-3.5 w-3.5 flex-shrink-0 ${theme === 'dark' ? 'text-blue-400/50' : 'text-slate-300'}`}
                />
              )}
            </span>
          );
        })}
      </nav>
    </>
  );
}
