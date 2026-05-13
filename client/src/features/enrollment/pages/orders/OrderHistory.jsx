import { Link } from 'react-router-dom';

export default function OrderHistory() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="section-title mb-8">Order History</h1>

      <div className="card p-12 text-center">
        <div className="text-5xl mb-4">🧾</div>
        <h2 className="text-xl font-semibold text-dark-900 dark:text-white mb-2">No orders yet</h2>
        <p className="text-dark-500 mb-6">Your purchase history will appear here</p>
        <Link to="/courses" className="btn-primary">Browse Courses</Link>
      </div>
    </div>
  );
}
