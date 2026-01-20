import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { MedicationAdministration } from '@/hooks/use-medication-administration';
import { Pill, User, CheckCircle, XCircle } from 'lucide-react';

interface AdministrationDialogProps {
  item: MedicationAdministration | null;
  mode: 'administer' | 'not-administer';
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmAdminister: (observacoes?: string) => void;
  onConfirmNotAdminister: (motivo: string, observacoes?: string) => void;
}

const NOT_ADMINISTERED_REASONS = [
  { value: 'recusou', label: 'Aluno recusou' },
  { value: 'ausente', label: 'Aluno ausente' },
  { value: 'sem_estoque', label: 'Sem estoque' },
  { value: 'orientacao_medica', label: 'Orientação médica' },
  { value: 'efeito_colateral', label: 'Efeito colateral' },
  { value: 'outro', label: 'Outro motivo' },
];

export function AdministrationDialog({
  item,
  mode,
  open,
  onOpenChange,
  onConfirmAdminister,
  onConfirmNotAdminister,
}: AdministrationDialogProps) {
  const [observacoes, setObservacoes] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      if (mode === 'administer') {
        await onConfirmAdminister(observacoes || undefined);
      } else {
        if (!motivo) return;
        await onConfirmNotAdminister(motivo, observacoes || undefined);
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'administer' ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                Confirmar Administração
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-amber-600" />
                Registrar Não Administrado
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === 'administer' 
              ? 'Confirme a administração do medicamento abaixo.'
              : 'Informe o motivo pelo qual o medicamento não foi administrado.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Medication Info */}
          <div className="p-4 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{item.student_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Pill className="h-4 w-4 text-muted-foreground" />
              <span>{item.medication_name}</span>
              {item.dosagem && <span className="text-muted-foreground">- {item.dosagem}</span>}
            </div>
            <div className="text-sm text-muted-foreground">
              Horário agendado: <span className="font-medium">{item.horario.substring(0, 5)}</span>
            </div>
          </div>

          {/* Not Administered Reason */}
          {mode === 'not-administer' && (
            <div className="space-y-3">
              <Label>Motivo *</Label>
              <RadioGroup value={motivo} onValueChange={setMotivo}>
                {NOT_ADMINISTERED_REASONS.map((reason) => (
                  <div key={reason.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={reason.value} id={reason.value} />
                    <Label htmlFor={reason.value} className="font-normal cursor-pointer">
                      {reason.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          {/* Observations */}
          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações (opcional)</Label>
            <Textarea
              id="observacoes"
              placeholder="Adicione observações se necessário..."
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
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
            disabled={loading || (mode === 'not-administer' && !motivo)}
            className={mode === 'administer' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {loading ? 'Salvando...' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
