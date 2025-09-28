import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Navigate, useLocation } from 'react-router-dom';
import { PermissionDenied } from './permission-denied';
import { useEffect, useState } from 'react';

interface UnifiedRouteProps {
  children: React.ReactNode;
  module?: string;
  action?: string;
  allowGuests?: boolean;
}

export function UnifiedRoute({ 
  children, 
  module, 
  action = 'read',
  allowGuests = false 
}: UnifiedRouteProps) {
  const { user, loading, isInitialized, hasPermission, canAccess, profile, permissions } = useAuth();
  const location = useLocation();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Debug detalhado das permissões
  useEffect(() => {
    if (isInitialized && user && profile) {
      const debug = {
        currentPath: location.pathname,
        module,
        action,
        userRole: profile.role,
        totalPermissions: permissions.length,
        hasPermissionResult: module ? hasPermission(module, action) : true,
        canAccessResult: module ? canAccess(module) : true,
        relevantPermissions: module ? permissions.filter(p => p.module === module) : []
      };
      setDebugInfo(debug);
      console.log('🔍 UnifiedRoute Debug:', debug);
    }
  }, [isInitialized, user, profile, permissions, location.pathname, module, action, hasPermission, canAccess]);

  // Loading state
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

  // Permitir acesso a convidados (para páginas públicas)
  if (allowGuests && !user) {
    return <>{children}</>;
  }

  // Redirecionar para auth se não estiver logado
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se não há módulo especificado, permite acesso (páginas gerais)
  if (!module) {
    return <>{children}</>;
  }

  // Verificar permissões do módulo
  const hasModuleAccess = canAccess(module);
  
  if (!hasModuleAccess) {
    console.log('❌ Acesso negado ao módulo:', { module, debugInfo });
    return <PermissionDenied />;
  }

  // Se chegou até aqui, tem acesso
  console.log('✅ Acesso permitido:', { module, action, debugInfo });
  return <>{children}</>;
}