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
    // Re-export das funções originais para compatibilidade
    hasPermission,
    canAccess,
    permissions,
    userRole: profile?.role
  };
}