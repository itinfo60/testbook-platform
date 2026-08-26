import { useLocation, Navigate } from 'react-router-dom';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

export default function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, user, loading, initialized } = useAuth();
  const location = useLocation();

  // Wait until auth state is fully resolved on initial load
  if (!initialized) return <LoadingSpinner fullScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
