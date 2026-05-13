import LoadingSpinner from '@/components/common/LoadingSpinner';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/features/auth/authSlice';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [params] = useSearchParams();

  useEffect(() => {
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');
    if (token) {
      dispatch(setCredentials({ token, refreshToken }));
      navigate('/dashboard', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [params, dispatch, navigate]);

  return <LoadingSpinner fullScreen text="Authenticating..." />;
}
