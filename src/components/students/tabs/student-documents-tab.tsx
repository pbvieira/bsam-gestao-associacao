import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StudentDocumentsTabProps {
  studentId?: string;
}

export function StudentDocumentsTab({ studentId }: StudentDocumentsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Documentos</CardTitle>
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