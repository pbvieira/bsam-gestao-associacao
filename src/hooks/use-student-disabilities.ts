import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StudentDisability {
  id: string;
  student_id: string;
  disability_type_id: string;
  possui: boolean;
  data_diagnostico: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DisabilityType {
  id: string;
  nome: string;
  descricao: string | null;
  informacao_adicional: string | null;
  cor: string;
  ordem: number;
  ativo: boolean;
}

export function useStudentDisabilities(studentId?: string) {
  const queryClient = useQueryClient();

  const { data: disabilityTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ["disability-types-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disability_types")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data as DisabilityType[];
    },
  });

  const { data: studentDisabilities = [], isLoading: isLoadingDisabilities } = useQuery({
    queryKey: ["student-disabilities", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("student_disabilities")
        .select("*")
        .eq("student_id", studentId);

      if (error) throw error;
      return data as StudentDisability[];
    },
    enabled: !!studentId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: {
      student_id: string;
      disability_type_id: string;
      possui: boolean;
      data_diagnostico?: string | null;
      observacoes?: string | null;
    }) => {
      const { error } = await supabase
        .from("student_disabilities")
        .upsert(data, { onConflict: "student_id,disability_type_id" });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-disabilities", studentId] });
    },
    onError: (error) => {
      console.error("Erro ao salvar deficiência:", error);
      toast.error("Erro ao salvar registro de deficiência");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ studentId, disabilityTypeId }: { studentId: string; disabilityTypeId: string }) => {
      const { error } = await supabase
        .from("student_disabilities")
        .delete()
        .eq("student_id", studentId)
        .eq("disability_type_id", disabilityTypeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-disabilities", studentId] });
    },
    onError: (error) => {
      console.error("Erro ao remover deficiência:", error);
      toast.error("Erro ao remover registro de deficiência");
    },
  });

  const getDisabilityStatus = (disabilityTypeId: string): StudentDisability | undefined => {
    return studentDisabilities.find(d => d.disability_type_id === disabilityTypeId);
  };

  const getStats = () => {
    const total = disabilityTypes.length;
    const positivas = studentDisabilities.filter(d => d.possui === true).length;
    const negativas = studentDisabilities.filter(d => d.possui === false).length;
    const naoInformadas = total - studentDisabilities.length;
    
    return { total, positivas, negativas, naoInformadas };
  };

  return {
    disabilityTypes,
    studentDisabilities,
    isLoading: isLoadingTypes || isLoadingDisabilities,
    saveDisability: saveMutation.mutate,
    deleteDisability: deleteMutation.mutate,
    getDisabilityStatus,
    getStats,
    isSaving: saveMutation.isPending,
  };
}
