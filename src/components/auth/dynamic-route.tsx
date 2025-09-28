import { useAuth } from '@/hooks/use-auth';
import { useNavigationFallback } from '@/hooks/use-navigation-fallback';
import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';

interface DynamicRouteProps {
  children: React.ReactNode;
  preferredModule?: string;
}

export function DynamicRoute({ children, preferredModule = 'dashboard' }: DynamicRouteProps) {
  const { hasPermission, isInitialized, loading } = useAuth();
  const { getDefaultRoute } = useNavigationFallback();

  // Show loading while auth is initializing
  if (loading || !isInitialized) {
    return <div>Carregando...</div>;
  }

  // Check if user has access to preferred module
  if (preferredModule && hasPermission(preferredModule, 'read')) {
    return <>{children}</>;
  }

  // Redirect to first accessible route
  return <Navigate to={getDefaultRoute()} replace />;
}