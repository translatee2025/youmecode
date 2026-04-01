import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import FullscreenLoader from '@/components/FullscreenLoader';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) return <FullscreenLoader />;
  if (!session) return <Navigate to="/auth" state={{ from: location }} replace />;

  return <>{children}</>;
}
