import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ResponsibilityTermForm } from '@/components/students/authorization-forms/responsibility-term-form';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

      if (error) {
        console.error('Erro ao buscar aluno:', error);
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

  const currentDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

  return (
    <ResponsibilityTermForm
      name={student.nome_completo}
      rg={student.rg || '_______________'}
      cpf={student.cpf || '_______________'}
      date={currentDate}
      city="São José - SC"
    />
  );
}
