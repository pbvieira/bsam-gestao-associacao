import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface DiseaseType {
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

export function useDiseaseTypes() {
  const queryClient = useQueryClient();

  const { data: diseaseTypes = [], isLoading } = useQuery({
    queryKey: ["disease-types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disease_types")
        .select("*")
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data as DiseaseType[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { nome: string; descricao?: string; informacao_adicional?: string; cor?: string; ordem?: number }) => {
      const { error } = await supabase.from("disease_types").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disease-types"] });
      toast.success("Tipo de doença criado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao criar tipo de doença:", error);
      toast.error("Erro ao criar tipo de doença");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<DiseaseType> & { id: string }) => {
      const { error } = await supabase
        .from("disease_types")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disease-types"] });
      toast.success("Tipo de doença atualizado com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao atualizar tipo de doença:", error);
      toast.error("Erro ao atualizar tipo de doença");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("disease_types")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disease-types"] });
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
        .from("disease_types")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["disease-types"] });
      toast.success("Tipo de doença removido com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao remover tipo de doença:", error);
      toast.error("Erro ao remover tipo de doença");
    },
  });

  return {
    diseaseTypes,
    isLoading,
    createDiseaseType: createMutation.mutate,
    updateDiseaseType: updateMutation.mutate,
    toggleStatus: toggleStatusMutation.mutate,
    deleteDiseaseType: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
