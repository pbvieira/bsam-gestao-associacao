import { UserRole } from '@/contexts/AuthContext';

// Sistema simples de controle de acesso baseado em roles
const MODULE_ACCESS: Record<UserRole, string[]> = {
  diretor: ['dashboard', 'users', 'students', 'tasks', 'calendar', 'inventory', 'suppliers', 'purchases', 'reports'],
  coordenador: ['dashboard', 'users', 'students', 'tasks', 'calendar', 'inventory', 'suppliers', 'purchases', 'reports'],
  auxiliar: ['dashboard', 'students', 'tasks', 'calendar', 'inventory'],
  aluno: ['dashboard', 'tasks', 'calendar'],
  administrador: ['dashboard', 'users', 'students', 'tasks', 'calendar', 'inventory', 'suppliers', 'purchases', 'reports']
};

export function canAccessModule(role: UserRole | undefined, module: string): boolean {
  if (!role) return false;
  return MODULE_ACCESS[role]?.includes(module) || false;
}

export function getAccessibleModules(role: UserRole | undefined): string[] {
  if (!role) return [];
  return MODULE_ACCESS[role] || [];
}