import { useAuth } from '@/hooks/use-auth';

/**
 * Hook centralizado para verificação de permissões
 * Simplifica e padroniza o controle de acesso
 */
export function usePermissions() {
  const { hasPermission, canAccess, permissions, profile, reloadPermissions } = useAuth();

  // Função simplificada para verificar acesso a módulos
  const canAccessModule = (module: string): boolean => {
    return canAccess(module);
  };

  // Função para verificar permissão específica
  const hasSpecificPermission = (module: string, action: string = 'read'): boolean => {
    return hasPermission(module, action);
  };

  // Funções granulares para ações específicas
  const canCreate = (module: string): boolean => {
    return hasPermission(module, 'create');
  };

  const canUpdate = (module: string): boolean => {
    return hasPermission(module, 'update');
  };

  const canDelete = (module: string): boolean => {
    return hasPermission(module, 'delete');
  };

  const canExport = (module: string): boolean => {
    return hasPermission(module, 'export');
  };

  const canRead = (module: string): boolean => {
    return hasPermission(module, 'read');
  };

  // Função para obter todas as permissões de um módulo
  const getModulePermissions = (module: string) => {
    return permissions.filter(p => p.module === module && p.allowed);
  };

  // Função para listar todos os módulos acessíveis
  const getAccessibleModules = (): string[] => {
    const modules = [...new Set(permissions.filter(p => p.allowed).map(p => p.module))];
    console.log('📋 Módulos acessíveis:', modules);
    return modules;
  };

  // Função para debug de permissões
  const debugPermissions = (module?: string) => {
    console.log('🔍 Debug Permissões:', {
      userRole: profile?.role,
      totalPermissions: permissions.length,
      allPermissions: permissions,
      modulePermissions: module ? getModulePermissions(module) : null,
      accessibleModules: getAccessibleModules()
    });
  };

  return {
    canAccessModule,
    hasSpecificPermission,
    getModulePermissions,
    getAccessibleModules,
    debugPermissions,
    reloadPermissions,
    // Funções granulares
    canCreate,
    canUpdate,
    canDelete,
    canExport,
    canRead,
    // Re-export das funções originais para compatibilidade
    hasPermission,
    canAccess,
    permissions,
    userRole: profile?.role
  };
}