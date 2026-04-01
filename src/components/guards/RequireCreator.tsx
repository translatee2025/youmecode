import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import FullscreenLoader from '@/components/FullscreenLoader';

export function RequireCreator({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useAuthStore();

  if (isLoading) return <FullscreenLoader />;
  if (!profile || profile.role !== 'creator') return <Navigate to="/" replace />;

  return <>{children}</>;
}
