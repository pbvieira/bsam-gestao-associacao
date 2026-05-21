import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useVaccinationTrips, type VaccinationTrip } from '@/hooks/use-vaccination-trips';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trip: VaccinationTrip | null;
}

export function CompleteVaccinationTripDialog({ open, onOpenChange, trip }: Props) {
  const { completeTrip } = useVaccinationTrips();
  const { toast } = useToast();
  const [dataVacinacao, setDataVacinacao] = useState(() => new Date().toISOString().slice(0, 10));
  const [results, setResults] = useState<Record<string, { vacinado: boolean; motivo: string }>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && trip) {
      setDataVacinacao(new Date().toISOString().slice(0, 10));
      const init: Record<string, { vacinado: boolean; motivo: string }> = {};
      (trip.queue_items || []).forEach(q => { init[q.id] = { vacinado: true, motivo: '' }; });
      setResults(init);
    }
  }, [open, trip]);

  if (!trip) return null;

  const handleSubmit = async () => {
    setSaving(true);
    const payload = (trip.queue_items || []).map(q => ({
      queue_item_id: q.id,
      student_id: q.student_id,
      vaccine_type_id: trip.vaccine_type_id,
      vacinado: results[q.id]?.vacinado ?? true,
      motivo: results[q.id]?.motivo || undefined,
    }));
    const res = await completeTrip({ trip_id: trip.id, data_vacinacao: dataVacinacao, results: payload });
    setSaving(false);
    if (res.error) toast({ title: 'Erro', description: res.error, variant: 'destructive' });
    else {
      toast({ title: 'Vacinação registrada', description: `${payload.filter(p => p.vacinado).length} aluno(s) vacinado(s).` });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Registrar vacinação — {trip.vaccine_type?.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Data da vacinação</Label>
            <Input type="date" value={dataVacinacao} onChange={e => setDataVacinacao(e.target.value)} className="max-w-xs" />
          </div>

          <div className="border rounded-md divide-y max-h-72 overflow-auto">
            {(trip.queue_items || []).map(q => {
              const r = results[q.id] || { vacinado: true, motivo: '' };
              return (
                <div key={q.id} className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{q.student?.nome_completo}</p>
                      <p className="text-xs text-muted-foreground">{q.student?.codigo_cadastro}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${r.vacinado ? 'text-green-600' : 'text-muted-foreground'}`}>
                        {r.vacinado ? 'Foi vacinado' : 'Não foi'}
                      </span>
                      <Switch
                        checked={r.vacinado}
                        onCheckedChange={(v) => setResults(prev => ({ ...prev, [q.id]: { ...r, vacinado: v } }))}
                      />
                    </div>
                  </div>
                  {!r.vacinado && (
                    <Textarea
                      placeholder="Motivo (opcional)"
                      value={r.motivo}
                      onChange={e => setResults(prev => ({ ...prev, [q.id]: { ...r, motivo: e.target.value } }))}
                      rows={2}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Alunos vacinados receberão a data registrada no histórico de vacinas. Os demais retornam para a fila.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
