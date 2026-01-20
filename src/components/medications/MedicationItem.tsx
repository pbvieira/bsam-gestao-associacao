import { Pill, User, FileText, Clock, Undo2, XCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { MedicationAdministration } from '@/hooks/use-medication-administration';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MedicationItemProps {
  item: MedicationAdministration;
  onAdminister: () => void;
  onNotAdminister: () => void;
  onUndo: () => void;
}

export function MedicationItem({ item, onAdminister, onNotAdminister, onUndo }: MedicationItemProps) {
  const wasNotAdministered = item.log_id && !item.administrado && item.nao_administrado_motivo;

  return (
    <div className={cn(
      "flex items-center gap-4 py-3 px-2 -mx-2 rounded-lg transition-colors",
      item.administrado && "bg-green-50/50 dark:bg-green-900/10",
      wasNotAdministered && "bg-amber-50/50 dark:bg-amber-900/10"
    )}>
      {/* Checkbox */}
      <div className="flex-shrink-0">
        <Checkbox
          checked={item.administrado}
          onCheckedChange={(checked) => {
            if (checked) {
              onAdminister();
            }
          }}
          disabled={item.administrado}
          className={cn(
            "h-6 w-6",
            item.administrado && "data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
          )}
        />
      </div>

      {/* Student and Medication Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-foreground">{item.student_name}</span>
          <Badge variant="outline" className="text-xs">
            {item.student_codigo}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
          <Pill className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="font-medium text-foreground/80">{item.medication_name}</span>
          {item.dosagem && (
            <span className="text-muted-foreground">- {item.dosagem}</span>
          )}
        </div>

        {item.instrucoes && (
          <div className="flex items-start gap-2 mt-1 text-xs text-muted-foreground">
            <FileText className="h-3 w-3 flex-shrink-0 mt-0.5" />
            <span>{item.instrucoes}</span>
          </div>
        )}

        {item.setor_nome && (
          <div className="mt-1">
            <Badge variant="secondary" className="text-xs">
              {item.setor_nome}
            </Badge>
          </div>
        )}
      </div>

      {/* Status and Actions */}
      <div className="flex-shrink-0 text-right flex items-center gap-2">
        {item.administrado ? (
          <>
            <div className="text-right">
              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {item.data_administracao && format(new Date(item.data_administracao), 'HH:mm', { locale: ptBR })}
                </span>
              </div>
              {item.administrado_por_nome && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  por {item.administrado_por_nome}
                </p>
              )}
              {item.observacoes && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[150px] cursor-help">
                        📝 {item.observacoes}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">{item.observacoes}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={onUndo}
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Desfazer administração
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        ) : wasNotAdministered ? (
          <>
            <div className="text-right">
              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Não administrado</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {item.nao_administrado_motivo}
              </p>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={onUndo}
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Remover registro
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                    onClick={onNotAdminister}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Não admin.
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Registrar que não foi administrado
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button
              variant="default"
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={onAdminister}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Administrar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
