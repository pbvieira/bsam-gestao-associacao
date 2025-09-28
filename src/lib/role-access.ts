import { UserRole } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Cache em memória para evitar múltiplas consultas
let cachedModuleAccess: Record<UserRole, string[]> | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

// Buscar permissões do banco de dados
async function fetchModuleAccess(): Promise<Record<UserRole, string[]>> {
  const { data, error } = await supabase
    .from('role_module_access')
    .select('role, module, allowed')
    .eq('allowed', true);

  if (error) {
    console.error('Erro ao buscar permissões:', error);
    // Fallback para permissões padrão em caso de erro
    return {
      diretor: ['dashboard', 'users', 'students', 'tasks', 'calendar', 'inventory', 'suppliers', 'purchases', 'reports'],
      coordenador: ['dashboard', 'users', 'students', 'tasks', 'calendar', 'inventory', 'suppliers', 'purchases', 'reports'],
      auxiliar: ['dashboard', 'students', 'tasks', 'calendar', 'inventory'],
      aluno: ['dashboard', 'tasks', 'calendar'],
      administrador: ['dashboard', 'users', 'students', 'tasks', 'calendar', 'inventory', 'suppliers', 'purchases', 'reports']
    };
  }

  // Organizar dados por role
  const moduleAccess: Record<UserRole, string[]> = {
    diretor: [],
    coordenador: [],
    auxiliar: [],
    aluno: [],
    administrador: []
  };

  data.forEach(item => {
    if (!moduleAccess[item.role as UserRole]) {
      moduleAccess[item.role as UserRole] = [];
    }
    moduleAccess[item.role as UserRole].push(item.module);
  });

  return moduleAccess;
}

// Obter permissões com cache
async function getModuleAccess(): Promise<Record<UserRole, string[]>> {
  const now = Date.now();
  
  // Verificar se o cache ainda é válido
  if (cachedModuleAccess && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedModuleAccess;
  }

  // Buscar do banco e atualizar cache
  cachedModuleAccess = await fetchModuleAccess();
  cacheTimestamp = now;
  
  return cachedModuleAccess;
}

// Invalidar cache (útil quando as permissões são atualizadas)
export function invalidateModuleAccessCache(): void {
  cachedModuleAccess = null;
  cacheTimestamp = 0;
}

export async function canAccessModule(role: UserRole | undefined, module: string): Promise<boolean> {
  if (!role) return false;
  
  try {
    const moduleAccess = await getModuleAccess();
    return moduleAccess[role]?.includes(module) || false;
  } catch (error) {
    console.error('Erro ao verificar acesso:', error);
    return false;
  }
}

export async function getAccessibleModules(role: UserRole | undefined): Promise<string[]> {
  if (!role) return [];
  
  try {
    const moduleAccess = await getModuleAccess();
    return moduleAccess[role] || [];
  } catch (error) {
    console.error('Erro ao obter módulos acessíveis:', error);
    return [];
  }
}