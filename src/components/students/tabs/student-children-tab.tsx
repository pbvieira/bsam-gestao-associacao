import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StudentChildrenTabProps {
  studentId?: string;
}

export function StudentChildrenTab({ studentId }: StudentChildrenTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filhos</CardTitle>
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