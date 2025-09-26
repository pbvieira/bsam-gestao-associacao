import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StudentContactsTabProps {
  studentId?: string;
}

export function StudentContactsTab({ studentId }: StudentContactsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contatos de Emergência</CardTitle>
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