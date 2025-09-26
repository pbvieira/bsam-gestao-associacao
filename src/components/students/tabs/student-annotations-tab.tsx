import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StudentAnnotationsTabProps {
  studentId?: string;
}

export function StudentAnnotationsTab({ studentId }: StudentAnnotationsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Anotações e Histórico</CardTitle>
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