import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { GenericDocumentRenderer } from '@/components/documents/generic-document-renderer';
import { Loader2 } from 'lucide-react';

interface StudentData {
  nome_completo: string;
  rg: string | null;
  cpf: string | null;
}

export default function StudentResponsibilityTerm() {
  const { id } = useParams<{ id: string }>();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStudent() {
      if (!id) return;
      const { data, error } = await supabase
        .from('students')
        .select('nome_completo, rg, cpf')
        .eq('id', id)
        .maybeSingle();
      if (error) console.error('Erro ao buscar aluno:', error);
      else setStudent(data);
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
        <p className="text-destructive">Aluno não encontrado</p>
      </div>
    );
  }

  return (
    <GenericDocumentRenderer
      slug="termo-responsabilidade"
      name={student.nome_completo}
      rg={student.rg}
      cpf={student.cpf}
      studentId={id}
    />
  );
}
