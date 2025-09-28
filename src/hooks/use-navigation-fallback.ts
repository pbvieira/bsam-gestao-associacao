import { useAuth } from '@/hooks/use-auth';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const routes = [
  { path: '/', module: 'dashboard', name: 'Dashboard' },
  { path: '/tarefas', module: 'tasks', name: 'Tarefas' },
  { path: '/calendario', module: 'calendar', name: 'Calendário' },
  { path: '/alunos', module: 'students', name: 'Alunos' },
  { path: '/usuarios', module: 'users', name: 'Usuários' },
  { path: '/estoque', module: 'inventory', name: 'Estoque' },
  { path: '/fornecedores', module: 'suppliers', name: 'Fornecedores' },
  { path: '/compras', module: 'purchases', name: 'Compras' },
  { path: '/relatorios', module: 'reports', name: 'Relatórios' },
];

export function useNavigationFallback() {
  const { canAccess } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const getAccessibleRoutes = () => {
    return routes.filter(route => canAccess(route.module));
  };

  const getDefaultRoute = () => {
    const accessibleRoutes = getAccessibleRoutes();
    return accessibleRoutes.length > 0 ? accessibleRoutes[0].path : '/auth';
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