import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAccessibleModules } from '@/hooks/use-role-access';

const routes = [
  { path: '/', module: 'dashboard', name: 'Dashboard' },
  { path: '/tarefas', module: 'tasks', name: 'TAREFAS' },
  { path: '/calendario', module: 'calendar', name: 'Calendário' },
  { path: '/alunos', module: 'students', name: 'Alunos' },
  { path: '/usuarios', module: 'users', name: 'Usuários' },
  { path: '/estoque', module: 'inventory', name: 'Estoque' },
  { path: '/fornecedores', module: 'suppliers', name: 'Fornecedores' },
  { path: '/compras', module: 'purchases', name: 'Compras' },
  { path: '/relatorios', module: 'reports', name: 'Relatórios' },
];

export function useNavigationFallback() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { modules: accessibleModules } = useAccessibleModules(profile?.role);

  const getAccessibleRoutes = () => {
    if (!profile) return [];
    
    const accessibleRoutes = routes.filter(route => accessibleModules.includes(route.module));
    console.log('🛣️ Rotas acessíveis:', { accessibleModules, accessibleRoutes });
    return accessibleRoutes;
  };

  const getDefaultRoute = () => {
    const accessibleRoutes = getAccessibleRoutes();
    const defaultPath = accessibleRoutes.length > 0 ? accessibleRoutes[0].path : '/auth';
    console.log('🏠 Rota padrão:', { defaultPath, totalAccessible: accessibleRoutes.length });
    return defaultPath;
  };

  const navigateToAccessible = (attemptedRoute?: string) => {
    const defaultRoute = getDefaultRoute();
    
    if (attemptedRoute && attemptedRoute !== defaultRoute) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página. Redirecionando para uma página disponível.",
        variant: "destructive",
      });
    }
    
    navigate(defaultRoute, { replace: true });
  };

  return {
    getAccessibleRoutes,
    getDefaultRoute,
    navigateToAccessible,
  };
}