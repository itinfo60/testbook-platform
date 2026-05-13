import { Link } from 'react-router-dom';

export default function MyTestAttempts() {
  // In a real app, you'd fetch from an API. For now, display a placeholder.
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="section-title mb-8">My Test Attempts</h1>

      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">📊</div>
        <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-2">Test History</h2>
        <p className="text-dark-500 mb-6">Your test attempts will appear here after you take a test</p>
        <Link to="/tests" className="btn-primary">Browse Tests</Link>
      </div>
    </div>
  );
}
