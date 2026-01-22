import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MedicalAppointment } from '@/hooks/use-medical-appointments';
import { Stethoscope, MapPin, User, RotateCcw } from 'lucide-react';

const NOT_COMPLETED_REASONS = [
  { value: 'falta_transporte', label: 'Falta de transporte' },
  { value: 'aluno_recusou', label: 'Aluno recusou' },
  { value: 'aluno_doente', label: 'Aluno doente' },
  { value: 'consulta_cancelada', label: 'Consulta cancelada pelo local' },
  { value: 'remarcado', label: 'Remarcado para outra data' },
  { value: 'outro', label: 'Outro motivo' },
];

interface AppointmentDialogProps {
  item: MedicalAppointment | null;
  mode: 'complete' | 'not-complete';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmComplete: (observacoes?: string) => Promise<void>;
  onConfirmNotComplete: (motivo: string, observacoes?: string) => Promise<void>;
}

export function AppointmentDialog({
  item,
  mode,
  open,
  onOpenChange,
  onConfirmComplete,
  onConfirmNotComplete,
}: AppointmentDialogProps) {
  const [observacoes, setObservacoes] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (mode === 'complete') {
        await onConfirmComplete(observacoes || undefined);
      } else {
        await onConfirmNotComplete(motivo, observacoes || undefined);
      }
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setObservacoes('');
    setMotivo('');
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === 'complete' ? 'Confirmar Realização' : 'Registrar Não Comparecimento'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'complete' 
              ? 'Confirme que o atendimento foi realizado.'
              : 'Registre o motivo do não comparecimento.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Appointment Info */}
          <div className="p-3 rounded-lg bg-muted/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">{item.student_name}</span>
              {item.tipo === 'retorno' && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <RotateCcw className="h-3 w-3" />
                  Retorno
                </span>
              )}
            </div>
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
          </div>

          {/* Reason selection (only for not-complete mode) */}
          {mode === 'not-complete' && (
            <div className="space-y-3">
              <Label>Motivo do não comparecimento *</Label>
              <RadioGroup value={motivo} onValueChange={setMotivo}>
                {NOT_COMPLETED_REASONS.map(reason => (
                  <div key={reason.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.label} id={reason.value} />
                    <Label htmlFor={reason.value} className="cursor-pointer font-normal">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Observations */}
          <div className="space-y-2">
            <Label>Observações (opcional)</Label>
            <Textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Adicione observações se necessário..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={loading || (mode === 'not-complete' && !motivo)}
            variant={mode === 'complete' ? 'default' : 'destructive'}
          >
            {loading ? 'Salvando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
