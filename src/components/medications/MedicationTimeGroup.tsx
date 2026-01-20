import { Clock, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MedicationItem } from './MedicationItem';
import { GroupedMedications, MedicationAdministration } from '@/hooks/use-medication-administration';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MedicationTimeGroupProps {
  group: GroupedMedications;
  onAdminister: (item: MedicationAdministration) => void;
  onNotAdminister: (item: MedicationAdministration) => void;
  onUndo: (item: MedicationAdministration) => void;
}

export function MedicationTimeGroup({ 
  group, 
  onAdminister, 
  onNotAdminister,
  onUndo 
}: MedicationTimeGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const allAdministered = group.administrados === group.total;
  const someAdministered = group.administrados > 0 && group.administrados < group.total;

  // Format time to HH:MM
  const formattedTime = group.horario.substring(0, 5);

  return (
    <Card className={cn(
      "mb-4 transition-all duration-200",
      allAdministered && "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20"
    )}>
      <CardHeader className="py-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex items-center justify-center w-12 h-12 rounded-lg",
              allAdministered 
                ? "bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400"
                : "bg-primary/10 text-primary"
            )}>
              {allAdministered ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <Clock className="h-6 w-6" />
              )}
            </div>
            <div>
              <span className="font-bold text-xl">{formattedTime}</span>
              <p className="text-sm text-muted-foreground">
                {group.total} {group.total === 1 ? 'aluno' : 'alunos'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge 
              variant={allAdministered ? "default" : someAdministered ? "secondary" : "outline"}
              className={cn(
                allAdministered && "bg-green-600 hover:bg-green-700"
              )}
            >
              {group.administrados}/{group.total} administrados
            </Badge>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0 pb-2">
          <div className="divide-y">
            {group.items.map(item => (
              <MedicationItem
                key={item.id}
                item={item}
                onAdminister={() => onAdminister(item)}
                onNotAdminister={() => onNotAdminister(item)}
                onUndo={() => onUndo(item)}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
