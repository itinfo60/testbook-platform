import { useSelector } from 'react-redux';
import { Navigate, Outlet } from 'react-router-dom';

const ADMIN_ROLES = ['admin', 'super_admin', 'superadmin'];

export default function ProtectedRoute() {
  const { isAuthenticated, user } = useSelector((s) => s.auth);

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && !ADMIN_ROLES.includes(user.role?.toLowerCase())) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}