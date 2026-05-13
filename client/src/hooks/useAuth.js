import { useSelector } from 'react-redux';

export function useAuth() {
  const { user, token, isAuthenticated, loading, initialized } = useSelector(state => state.auth);

  return {
    user,
    token,
    isAuthenticated,
    loading,
    initialized,
    isAdmin: user?.role === 'admin',
    isTeacher: user?.role === 'teacher',
    isStudent: user?.role === 'student',
  };
}

export default useAuth;
