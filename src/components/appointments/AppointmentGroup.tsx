import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Stethoscope, Smile, Brain, TestTube, Scan, Syringe, Ambulance, FileText, RotateCcw } from 'lucide-react';
import { GroupedAppointments, MedicalAppointment } from '@/hooks/use-medical-appointments';
import { AppointmentItem } from './AppointmentItem';

const ICON_MAP: Record<string, React.ReactNode> = {
  'Stethoscope': <Stethoscope className="h-5 w-5" />,
  'Smile': <Smile className="h-5 w-5" />,
  'Brain': <Brain className="h-5 w-5" />,
  'TestTube': <TestTube className="h-5 w-5" />,
  'Scan': <Scan className="h-5 w-5" />,
  'Syringe': <Syringe className="h-5 w-5" />,
  'Ambulance': <Ambulance className="h-5 w-5" />,
  'FileText': <FileText className="h-5 w-5" />,
  'RotateCcw': <RotateCcw className="h-5 w-5" />,
};

interface AppointmentGroupProps {
  group: GroupedAppointments;
  onComplete: (item: MedicalAppointment) => void;
  onNotComplete: (item: MedicalAppointment) => void;
  onUndo: (item: MedicalAppointment) => void;
}

export function AppointmentGroup({ 
  group, 
  onComplete, 
  onNotComplete, 
  onUndo 
}: AppointmentGroupProps) {
  const [expanded, setExpanded] = useState(true);

  const allCompleted = group.realizados === group.total;
  const someCompleted = group.realizados > 0 && group.realizados < group.total;

  return (
    <Card className="overflow-hidden">
      <CardHeader 
        className={`cursor-pointer transition-colors ${
          allCompleted 
            ? 'bg-green-50 dark:bg-green-900/20' 
            : someCompleted 
              ? 'bg-yellow-50 dark:bg-yellow-900/20'
              : 'bg-muted/30'
        }`}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-primary">
              {ICON_MAP[group.icon] || <FileText className="h-5 w-5" />}
            </div>
            <CardTitle className="text-lg font-semibold">{group.grupo}</CardTitle>
            <Badge 
              variant={allCompleted ? 'default' : someCompleted ? 'secondary' : 'outline'}
              className={allCompleted ? 'bg-green-600' : ''}
            >
              {group.total} aluno{group.total !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {group.realizados}/{group.total} realizados
            </span>
            {expanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-4 space-y-3">
          {group.items.map(item => (
            <AppointmentItem
              key={item.id}
              item={item}
              onComplete={() => onComplete(item)}
              onNotComplete={() => onNotComplete(item)}
              onUndo={() => onUndo(item)}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
}
