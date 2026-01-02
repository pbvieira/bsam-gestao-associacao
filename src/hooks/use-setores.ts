import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Setor {
  id: string;
  area_id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface SetorFormData {
  area_id: string;
  nome: string;
  descricao?: string;
  ordem?: number;
  ativo?: boolean;
}

export function useSetores(areaId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: setores = [], isLoading, error } = useQuery({
    queryKey: ['setores', areaId],
    queryFn: async () => {
      let query = supabase
        .from('setores')
        .select('*')
        .order('ordem', { ascending: true });

      if (areaId) {
        query = query.eq('area_id', areaId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Setor[];
    },
  });

  const createSetor = useMutation({
    mutationFn: async (formData: SetorFormData) => {
      const { data, error } = await supabase
        .from('setores')
        .insert({
          area_id: formData.area_id,
          nome: formData.nome,
          descricao: formData.descricao || null,
          ordem: formData.ordem ?? 0,
          ativo: formData.ativo ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores'] });
      toast({
        title: 'Setor criado',
        description: 'O setor foi criado com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao criar setor:', error);
      toast({
        title: 'Erro ao criar setor',
        description: 'Ocorreu um erro ao criar o setor.',
        variant: 'destructive',
      });
    },
  });

  const updateSetor = useMutation({
    mutationFn: async ({ id, ...formData }: SetorFormData & { id: string }) => {
      const { data, error } = await supabase
        .from('setores')
        .update({
          area_id: formData.area_id,
          nome: formData.nome,
          descricao: formData.descricao || null,
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
      queryClient.invalidateQueries({ queryKey: ['setores'] });
      toast({
        title: 'Setor atualizado',
        description: 'O setor foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao atualizar setor:', error);
      toast({
        title: 'Erro ao atualizar setor',
        description: 'Ocorreu um erro ao atualizar o setor.',
        variant: 'destructive',
      });
    },
  });

  const deleteSetor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('setores')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores'] });
      toast({
        title: 'Setor excluído',
        description: 'O setor foi excluído com sucesso.',
      });
    },
    onError: (error) => {
      console.error('Erro ao excluir setor:', error);
      toast({
        title: 'Erro ao excluir setor',
        description: 'Ocorreu um erro ao excluir o setor.',
        variant: 'destructive',
      });
    },
  });

  const toggleSetorStatus = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { data, error } = await supabase
        .from('setores')
        .update({ ativo })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['setores'] });
      toast({
        title: variables.ativo ? 'Setor ativado' : 'Setor desativado',
        description: `O setor foi ${variables.ativo ? 'ativado' : 'desativado'} com sucesso.`,
      });
    },
    onError: (error) => {
      console.error('Erro ao alterar status:', error);
      toast({
        title: 'Erro ao alterar status',
        description: 'Ocorreu um erro ao alterar o status do setor.',
        variant: 'destructive',
      });
    },
  });

  return {
    setores,
    isLoading,
    error,
    createSetor,
    updateSetor,
    deleteSetor,
    toggleSetorStatus,
  };
}

// Hook para buscar todos os setores (para uso em relatórios, etc.)
export function useAllSetores() {
  return useSetores();
}
