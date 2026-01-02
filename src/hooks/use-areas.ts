import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Area {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface AreaFormData {
  nome: string;
  descricao?: string;
  cor?: string;
  ordem?: number;
  ativo?: boolean;
}

export function useAreas() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: areas = [], isLoading, error } = useQuery({
    queryKey: ['areas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('areas')
        .select('*')
        .order('ordem', { ascending: true });

      if (error) throw error;
      return data as Area[];
    },
  });

  const createArea = useMutation({
    mutationFn: async (formData: AreaFormData) => {
      const { data, error } = await supabase
        .from('areas')
        .insert({
          nome: formData.nome,
          descricao: formData.descricao || null,
          cor: formData.cor || '#6366f1',
          ordem: formData.ordem ?? 0,
          ativo: formData.ativo ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast({
        title: 'Área criada',
        description: 'A área foi criada com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao criar área:', error);
      toast({
        title: 'Erro ao criar área',
        description: 'Ocorreu um erro ao criar a área.',
        variant: 'destructive',
      });
    },
  });

  const updateArea = useMutation({
    mutationFn: async ({ id, ...formData }: AreaFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('areas')
        .update({
          nome: formData.nome,
          descricao: formData.descricao || null,
          cor: formData.cor,
          ordem: formData.ordem,
          ativo: formData.ativo,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast({
        title: 'Área atualizada',
        description: 'A área foi atualizada com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar área:', error);
      toast({
        title: 'Erro ao atualizar área',
        description: 'Ocorreu um erro ao atualizar a área.',
        variant: 'destructive',
      });
    },
  });

  const deleteArea = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('areas')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      queryClient.invalidateQueries({ queryKey: ['setores'] });
      toast({
        title: 'Área excluída',
        description: 'A área e seus setores foram excluídos com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao excluir área:', error);
      toast({
        title: 'Erro ao excluir área',
        description: 'Ocorreu um erro ao excluir a área.',
        variant: 'destructive',
      });
    },
  });

  const toggleAreaStatus = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data, error } = await supabase
        .from('areas')
        .update({ ativo })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['areas'] });
      toast({
        title: variables.ativo ? 'Área ativada' : 'Área desativada',
        description: `A área foi ${variables.ativo ? 'ativada' : 'desativada'} com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro ao alterar status',
        description: 'Ocorreu um erro ao alterar o status da área.',
        variant: 'destructive',
      });
    },
  });

  return {
    areas,
    isLoading,
    error,
    createArea,
    updateArea,
    deleteArea,
    toggleAreaStatus,
  };
}
