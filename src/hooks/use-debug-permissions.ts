import { useAuth } from '@/hooks/use-auth';

/**
 * Hook para debug e diagnóstico de permissões
 * Facilita a identificação de problemas de acesso
 */
export function useDebugPermissions() {
  const { user, profile, permissions, hasPermission, canAccess, reloadPermissions } = useAuth();

  // Função completa de diagnóstico
  const runDiagnostics = () => {
    console.group('🔍 DIAGNÓSTICO COMPLETO DE PERMISSÕES');
    
    console.log('👤 Usuario:', {
      authenticated: !!user,
      userId: user?.id,
      email: user?.email
    });
    
    console.log('📝 Profile:', {
      loaded: !!profile,
      role: profile?.role,
      active: profile?.active,
      fullName: profile?.full_name
    });
    
    console.log('🔐 Permissões:', {
      total: permissions.length,
      modules: [...new Set(permissions.map(p => p.module))],
      permissions: permissions
    });
    
    if (permissions.length > 0) {
      console.table(permissions);
    }
    
    console.log('🧪 Testes de Acesso:');
    const testModules = ['dashboard', 'users', 'students', 'tasks', 'calendar', 'reports'];
    testModules.forEach(module => {
      const canAccess_ = canAccess(module);
      const canRead = hasPermission(module, 'read');
      console.log(`  ${module}:`, { canAccess: canAccess_, canRead });
    });
    
    console.groupEnd();
    
    return {
      isAuthenticated: !!user,
      hasProfile: !!profile,
      hasPermissions: permissions.length > 0,
      role: profile?.role,
      moduleCount: [...new Set(permissions.map(p => p.module))].length
    };
  };

  // Teste específico para um módulo
  const testModuleAccess = (module: string) => {
    console.group(`🔍 TESTE DE ACESSO: ${module.toUpperCase()}`);
    
    const modulePermissions = permissions.filter(p => p.module === module);
    console.log('Permissões do módulo:', modulePermissions);
    
    const canAccess_ = canAccess(module);
    const canRead = hasPermission(module, 'read');
    const canCreate = hasPermission(module, 'create');
    const canUpdate = hasPermission(module, 'update');
    const canDelete = hasPermission(module, 'delete');
    
    console.log('Resultados:', {
      canAccess: canAccess_,
      canRead,
      canCreate,
      canUpdate,
      canDelete
    });
    
    console.groupEnd();
    
    return {
      canAccess: canAccess_,
      canRead,
      canCreate,
      canUpdate,
      canDelete,
      permissions: modulePermissions
    };
  };

  // Função para forçar recarga completa
  const forceReload = async () => {
    console.log('🔄 Forçando recarga completa de permissões...');
    await reloadPermissions();
    console.log('✅ Recarga concluída, executando novo diagnóstico...');
    runDiagnostics();
  };

  // Auto-diagnóstico quando o hook é chamado
  if (permissions.length > 0) {
    console.log('🔍 Debug permissions hook loaded - role:', profile?.role, 'permissions:', permissions.length);
  }

  return {
    runDiagnostics,
    testModuleAccess,
    forceReload,
    // Dados para facilitar debug
    authStatus: {
      authenticated: !!user,
      hasProfile: !!profile,
      hasPermissions: permissions.length > 0,
      role: profile?.role
    },
    quickTest: () => {
      const dashboard = canAccess('dashboard');
      const users = canAccess('users');
      const tasks = canAccess('tasks');
      
      console.log('🚀 Quick Access Test:', { dashboard, users, tasks });
      return { dashboard, users, tasks };
    }
  };
}