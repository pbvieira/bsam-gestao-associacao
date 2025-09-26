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

  console.log('ProtectedRoute:', { user: !!user, authLoading, permissionsLoading, module });

  // Show loading while checking auth status
  if (authLoading || (user && permissionsLoading)) {
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
    console.log('No user, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  // Check module permissions if specified
  if (module && !hasPermission(module, action)) {
    console.log('No permission for module:', module, action);
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

  return <>{children}</>;
}