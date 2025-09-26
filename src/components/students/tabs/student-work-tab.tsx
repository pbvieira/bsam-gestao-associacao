import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StudentWorkTabProps {
  studentId?: string;
}

export function StudentWorkTab({ studentId }: StudentWorkTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Situação Trabalhista</CardTitle>
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