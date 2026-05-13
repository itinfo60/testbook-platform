import { Link } from 'react-router-dom';
import { HiHome } from 'react-icons/hi';

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-bold gradient-text mb-4">404</div>
        <h1 className="text-2xl font-bold text-dark-900 dark:text-white mb-2">Page Not Found</h1>
        <p className="text-dark-500 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <HiHome className="h-4 w-4" /> Go Home
        </Link>
      </div>
    </div>
  );
}
