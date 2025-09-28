import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { UserRole } from '@/hooks/use-auth';

export interface RoleModuleAccess {
  id: string;
  role: UserRole;
  module: string;
  allowed: boolean;
  created_at: string;
  updated_at: string;
}

// Hook para buscar todas as permissões de roles
export function useRoleAccess() {
  return useQuery({
    queryKey: ['role-access'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('role_module_access')
        .select('*')
        .order('role', { ascending: true })
        .order('module', { ascending: true });

      if (error) throw error;
      return data as RoleModuleAccess[];
    },
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
    gcTime: 10 * 60 * 1000, // Manter cache por 10 minutos
  });
}

// Hook para buscar permissões de um role específico
export function useRoleAccessByRole(role: UserRole | undefined) {
  return useQuery({
    queryKey: ['role-access', role],
    queryFn: async () => {
      if (!role) return [];
      
      const { data, error } = await supabase
        .from('role_module_access')
        .select('*')
        .eq('role', role)
        .eq('allowed', true);

      if (error) throw error;
      return data as RoleModuleAccess[];
    },
    enabled: !!role,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// Hook para atualizar permissões
export function useUpdateRoleAccess() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (updates: { role: UserRole; module: string; allowed: boolean }[]) => {
      const promises = updates.map(update => 
        supabase
          .from('role_module_access')
          .update({ allowed: update.allowed })
          .eq('role', update.role)
          .eq('module', update.module)
      );

      const results = await Promise.all(promises);
      
      // Verificar se alguma operação falhou
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        throw new Error(`Falha ao atualizar ${errors.length} permissões`);
      }

      return results;
    },
    onSuccess: () => {
      // Invalidar cache para forçar atualização
      queryClient.invalidateQueries({ queryKey: ['role-access'] });
      toast({
        title: "Permissões atualizadas",
        description: "As permissões foram atualizadas com sucesso.",
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar permissões:', error);
      toast({
        title: "Erro ao atualizar permissões",
        description: "Ocorreu um erro ao salvar as alterações.",
        variant: "destructive",
      });
    },
  });
}

// Hook para buscar módulos acessíveis de um role
export function useAccessibleModules(role: UserRole | undefined) {
  const { data: roleAccess } = useRoleAccessByRole(role);
  
  return {
    modules: (roleAccess || []).map(access => access.module),
    canAccess: (module: string) => {
      if (!roleAccess) return false;
      return roleAccess.some(access => access.module === module && access.allowed);
    }
  };
}