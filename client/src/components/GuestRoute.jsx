import { useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function GuestRoute({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  return children;
}
