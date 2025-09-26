import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StudentHealthTabProps {
  studentId?: string;
}

export function StudentHealthTab({ studentId }: StudentHealthTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados de Saúde</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-muted-foreground">
          <p>Aba em desenvolvimento...</p>
          {studentId && <p className="text-sm">Student ID: {studentId}</p>}
        </div>
      </CardContent>
    </Card>
  );
}