import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePermissions } from '@/hooks/use-permissions';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Lock } from 'lucide-react';
import { Navigate } from 'react-router-dom';

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
  const { user, loading: authLoading } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const [isInitializing, setIsInitializing] = useState(true);

  // Prevent flash of permission denied during initial load
  useEffect(() => {
    if (!authLoading && !permissionsLoading) {
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 100); // Small delay to prevent flash
      
      return () => clearTimeout(timer);
    }
  }, [authLoading, permissionsLoading]);

  // Show loading during initialization or permission checks
  if (authLoading || permissionsLoading || isInitializing) {
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
      return fallback || (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Alert className="max-w-md">
            <Lock className="h-4 w-4" />
            <AlertDescription>
              Você não tem permissão para acessar esta funcionalidade.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
  }

  return <>{children}</>;
}