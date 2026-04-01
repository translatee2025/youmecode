import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import FullscreenLoader from '@/components/FullscreenLoader';

export function RequirePlatformAdmin({ children }: { children: React.ReactNode }) {
  const { profile, isLoading } = useAuthStore();

  if (isLoading) return <FullscreenLoader />;
  if (!profile || profile.role !== 'platform_admin') return <Navigate to="/" replace />;

  return <>{children}</>;
}
