import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Navigate } from 'react-router-dom';
import { useNavigationFallback } from '@/hooks/use-navigation-fallback';
import { PermissionDenied } from './permission-denied';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  module?: string;
  action?: string;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  module, 
  action = 'read',
  fallback 
}: ProtectedRouteProps) {
  const { user, loading, isInitialized, hasPermission } = useAuth();
  const { navigateToAccessible } = useNavigationFallback();

  // Show loading while auth is initializing
  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="space-y-4 p-6">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  // Redirect to auth if no user
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check module permissions if specified
  if (module) {
    const hasAccess = hasPermission(module, action);
    
    if (!hasAccess) {
      return fallback || <PermissionDenied />;
    }
  }

  return <>{children}</>;
}