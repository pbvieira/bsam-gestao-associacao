import { MedicalAppointment } from '@/hooks/use-medical-appointments';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  CheckCircle, 
  XCircle, 
  Undo2, 
  RotateCcw,
  MapPin, 
  User, 
  Stethoscope,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AppointmentItemProps {
  item: MedicalAppointment;
  onComplete: () => void;
  onNotComplete: () => void;
  onUndo: () => void;
}

export function AppointmentItem({ 
  item, 
  onComplete, 
  onNotComplete, 
  onUndo 
}: AppointmentItemProps) {
  const wasNotCompleted = item.nao_realizado_motivo && !item.realizado;
  const isCompleted = item.realizado && !item.nao_realizado_motivo;

  return (
    <div className={`p-4 border rounded-lg transition-all ${
      isCompleted 
        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
        : wasNotCompleted 
          ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          : 'bg-card border-border hover:border-primary/30'
    }`}>
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="pt-0.5">
          <Checkbox 
            checked={isCompleted}
            disabled={wasNotCompleted}
            onCheckedChange={() => {
              if (!isCompleted && !wasNotCompleted) {
                onComplete();
              }
            }}
            className={isCompleted ? 'data-[state=checked]:bg-green-600' : ''}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Student name and type badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
              {item.student_name}
            </span>
            {item.student_codigo && (
              <Badge variant="outline" className="text-xs">
                {item.student_codigo}
              </Badge>
            )}
            {item.tipo === 'retorno' && (
              <Badge variant="secondary" className="text-xs">
                <RotateCcw className="h-3 w-3 mr-1" />
                Retorno
              </Badge>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {item.especialidade && (
              <span className="flex items-center gap-1">
                <Stethoscope className="h-3.5 w-3.5" />
                {item.especialidade}
              </span>
            )}
            {item.profissional && (
              <span className="flex items-center gap-1">
                <User className="h-3.5 w-3.5" />
                {item.profissional}
              </span>
            )}
            {item.local && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {item.local}
              </span>
            )}
          </div>

          {/* Motivo */}
          {item.motivo && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Motivo:</span> {item.motivo}
            </p>
          )}

          {/* Completion status */}
          {isCompleted && (
            <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
              <CheckCircle className="h-4 w-4" />
              <span>
                Realizado às {format(new Date(item.data_realizacao!), "HH:mm", { locale: ptBR })}
                {item.realizado_por_nome && ` por ${item.realizado_por_nome}`}
              </span>
            </div>
          )}

          {wasNotCompleted && (
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <span>
                Não realizado: {item.nao_realizado_motivo}
                {item.realizado_por_nome && ` (${item.realizado_por_nome})`}
              </span>
            </div>
          )}

          {item.observacoes && (
            <p className="text-sm text-muted-foreground italic">
              Obs: {item.observacoes}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!item.log_id ? (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-amber-600 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      onClick={onNotComplete}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Não compareceu
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Registrar que não compareceu</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button
                variant="default"
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                onClick={onComplete}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Realizado
              </Button>
            </>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={onUndo}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                  >
                    <Undo2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Desfazer</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
    </div>
  );
}
