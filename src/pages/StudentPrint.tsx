import { useParams, useNavigate } from 'react-router-dom';
import { StudentPrintView } from '@/components/students/student-print-view';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function StudentPrint() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p>ID do aluno não informado.</p>
        <Button onClick={() => navigate('/alunos')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Alunos
        </Button>
      </div>
    );
  }

  return <StudentPrintView studentId={id} />;
}
