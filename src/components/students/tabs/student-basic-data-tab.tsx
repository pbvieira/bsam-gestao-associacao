import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StudentBasicDataTabProps {
  studentId?: string;
}

export function StudentBasicDataTab({ studentId }: StudentBasicDataTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dados Básicos</CardTitle>
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