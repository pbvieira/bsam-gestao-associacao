import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ImageAuthorizationForm } from "@/components/students/authorization-forms/image-authorization-form";
import { Loader2 } from "lucide-react";

interface Student {
  id: string;
  nome_completo: string;
  rg: string | null;
  cpf: string | null;
}

export default function StudentImageAuthorization() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudent() {
      if (!id) return;

      const { data, error } = await supabase
        .from("students")
        .select("id, nome_completo, rg, cpf")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Erro ao buscar aluno:", error);
      } else {
        setStudent(data);
      }
      setLoading(false);
    }

    fetchStudent();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Aluno não encontrado</p>
      </div>
    );
  }

  return (
    <ImageAuthorizationForm
      name={student.nome_completo}
      rg={student.rg}
      cpf={student.cpf}
    />
  );
}
