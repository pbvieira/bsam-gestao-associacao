import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface StudentDisease {
  id: string;
  student_id: string;
  disease_type_id: string;
  possui: boolean;
  data_diagnostico: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiseaseType {
  id: string;
  nome: string;
  descricao: string | null;
  informacao_adicional: string | null;
  cor: string;
  ordem: number;
  ativo: boolean;
}

export function useStudentDiseases(studentId?: string) {
  const queryClient = useQueryClient();

  const { data: diseaseTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ["disease-types-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("disease_types")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data as DiseaseType[];
    },
  });

  const { data: studentDiseases = [], isLoading: isLoadingDiseases } = useQuery({
    queryKey: ["student-diseases", studentId],
    queryFn: async () => {
      if (!studentId) return [];
      
      const { data, error } = await supabase
        .from("student_diseases")
        .select("*")
        .eq("student_id", studentId);

      if (error) throw error;
      return data as StudentDisease[];
    },
    enabled: !!studentId,
  });

  const saveMutation = useMutation({
    mutationFn: async (data: {
      student_id: string;
      disease_type_id: string;
      possui: boolean;
      data_diagnostico?: string | null;
      observacoes?: string | null;
    }) => {
      const { error } = await supabase
        .from("student_diseases")
        .upsert(data, { onConflict: "student_id,disease_type_id" });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-diseases", studentId] });
    },
    onError: (error) => {
      console.error("Erro ao salvar doença:", error);
      toast.error("Erro ao salvar registro de doença");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ studentId, diseaseTypeId }: { studentId: string; diseaseTypeId: string }) => {
      const { error } = await supabase
        .from("student_diseases")
        .delete()
        .eq("student_id", studentId)
        .eq("disease_type_id", diseaseTypeId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student-diseases", studentId] });
    },
    onError: (error) => {
      console.error("Erro ao remover doença:", error);
      toast.error("Erro ao remover registro de doença");
    },
  });

  const getDiseaseStatus = (diseaseTypeId: string): StudentDisease | undefined => {
    return studentDiseases.find(d => d.disease_type_id === diseaseTypeId);
  };

  const getStats = () => {
    const total = diseaseTypes.length;
    const positivas = studentDiseases.filter(d => d.possui === true).length;
    const negativas = studentDiseases.filter(d => d.possui === false).length;
    const naoInformadas = total - studentDiseases.length;
    
    return { total, positivas, negativas, naoInformadas };
  };

  return {
    diseaseTypes,
    studentDiseases,
    isLoading: isLoadingTypes || isLoadingDiseases,
    saveDisease: saveMutation.mutate,
    deleteDisease: deleteMutation.mutate,
    getDiseaseStatus,
    getStats,
    isSaving: saveMutation.isPending,
  };
}
