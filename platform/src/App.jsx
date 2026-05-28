import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { getProfile } from '@/store/authSlice';
import Layout from '@/components/Layout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import InstitutesPage from '@/pages/InstitutesPage';
import PlansPage from '@/pages/PlansPage';
import UsersPage from '@/pages/UsersPage';
import AnalyticsPage from '@/pages/AnalyticsPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, initialized } = useSelector((s) => s.auth);
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);

  useEffect(() => {
    if (localStorage.getItem('platformToken')) {
      dispatch(getProfile());
    }
  }, [dispatch]);

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="institutes" element={<InstitutesPage />} />
          <Route path="plans" element={<PlansPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 5000,
          style: { background: '#1f2937', color: '#fff', border: '1px solid #374151' },
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                {message}
                <button
                  onClick={() => toast.dismiss(t.id)}
                  style={{
                    marginLeft: 8,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#9ca3af',
                    fontSize: 16,
                    lineHeight: 1,
                    padding: '0 2px',
                  }}
                  aria-label="Dismiss"
                >
                  ✕
                </button>
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
    </>
  );
}
