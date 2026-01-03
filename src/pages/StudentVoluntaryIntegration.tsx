import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { VoluntaryIntegrationForm } from '@/components/students/authorization-forms/voluntary-integration-form';

interface StudentData {
  nome_completo: string;
  rg: string | null;
  cpf: string | null;
}

export default function StudentVoluntaryIntegration() {
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
        .single();

      if (error) {
        console.error('Error fetching student:', error);
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
        <p className="text-muted-foreground">Carregando...</p>
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
    <VoluntaryIntegrationForm
      name={student.nome_completo}
      rg={student.rg}
      cpf={student.cpf}
    />
  );
}
