import { Clock, ChevronDown, ChevronUp, CheckCircle2, CheckCheck } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MedicationItem } from './MedicationItem';
import { GroupedMedications, MedicationAdministration } from '@/hooks/use-medication-administration';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MedicationTimeGroupProps {
  group: GroupedMedications;
  onAdminister: (item: MedicationAdministration) => void;
  onNotAdminister: (item: MedicationAdministration) => void;
  onUndo: (item: MedicationAdministration) => void;
  onBulkAdminister: (items: MedicationAdministration[]) => void;
}

export function MedicationTimeGroup({ 
  group, 
  onAdminister, 
  onNotAdminister,
  onUndo,
  onBulkAdminister
}: MedicationTimeGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  const allAdministered = group.administrados === group.total;
  const someAdministered = group.administrados > 0 && group.administrados < group.total;

  // Pending items (not administered and no "not administered" reason)
  const pendingItems = group.items.filter(i => !i.administrado && !i.nao_administrado_motivo);
  const hasPending = pendingItems.length > 0;

  const allPendingSelected = hasPending && pendingItems.every(i => selectedIds.has(i.id));
  const somePendingSelected = pendingItems.some(i => selectedIds.has(i.id));

  const toggleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingItems.map(i => i.id)));
    }
  };

  const toggleSelectItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleBulkAdminister = () => {
    const items = group.items.filter(i => selectedIds.has(i.id));
    if (items.length > 0) {
      onBulkAdminister(items);
      setSelectedIds(new Set());
    }
  };

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
          {/* Bulk actions bar */}
          {hasPending && (
            <div className="flex items-center gap-3 py-2 px-2 mb-2 bg-muted/50 rounded-lg border border-border">
              <Checkbox
                checked={allPendingSelected}
                ref={undefined}
                onCheckedChange={toggleSelectAll}
                className="h-5 w-5"
                aria-label="Selecionar todos os pendentes"
              />
              <span className="text-sm text-muted-foreground flex-1">
                {somePendingSelected
                  ? `${selectedIds.size} selecionado(s)`
                  : `Selecionar todos os pendentes (${pendingItems.length})`}
              </span>
              {somePendingSelected && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={handleBulkAdminister}
                      >
                        <CheckCheck className="h-4 w-4 mr-1" />
                        Administrar {selectedIds.size > 1 ? `(${selectedIds.size})` : ''}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      Marcar selecionados como administrados
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          )}

          <div className="divide-y">
            {group.items.map(item => {
              const isPending = !item.administrado && !item.nao_administrado_motivo;
              return (
                <div key={item.id} className="flex items-start gap-1">
                  {hasPending && (
                    <div className="flex-shrink-0 pl-2 pt-3" onClick={(e) => e.stopPropagation()}>
                      {isPending ? (
                        <Checkbox
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={() => toggleSelectItem(item.id)}
                          className="h-5 w-5"
                          aria-label={`Selecionar ${item.student_name}`}
                        />
                      ) : (
                        <div className="w-5" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <MedicationItem
                      item={item}
                      onAdminister={() => onAdminister(item)}
                      onNotAdminister={() => onNotAdminister(item)}
                      onUndo={() => onUndo(item)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
