import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DisabilityType {
  id: string;
  nome: string;
  descricao: string | null;
  informacao_adicional: string | null;
  cor: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function useDisabilityTypes() {
  const queryClient = useQueryClient();

  const { data: disabilityTypes = [], isLoading } = useQuery({
    queryKey: ["disability-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disability_types")
        .select("*")
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data as DisabilityType[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { nome: string; descricao?: string; informacao_adicional?: string; cor?: string; ordem?: number }) => {
      const { error } = await supabase.from("disability_types").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disability-types"] });
      toast.success("Tipo de deficiência criado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar tipo de deficiência:", error);
      toast.error("Erro ao criar tipo de deficiência");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<DisabilityType> & { id: string }) => {
      const { error } = await supabase
        .from("disability_types")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disability-types"] });
      toast.success("Tipo de deficiência atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar tipo de deficiência:", error);
      toast.error("Erro ao atualizar tipo de deficiência");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("disability_types")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disability-types"] });
      toast.success("Status atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("disability_types")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disability-types"] });
      toast.success("Tipo de deficiência removido com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao remover tipo de deficiência:", error);
      toast.error("Erro ao remover tipo de deficiência");
    },
  });

  return {
    disabilityTypes,
    isLoading,
    createDisabilityType: createMutation.mutate,
    updateDisabilityType: updateMutation.mutate,
    toggleStatus: toggleStatusMutation.mutate,
    deleteDisabilityType: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
