import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAreas } from '@/hooks/use-areas';
import { useSetores } from '@/hooks/use-setores';
import { useVaccinationTrips } from '@/hooks/use-vaccination-trips';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { VaccinationQueueItem } from '@/hooks/use-vaccination-queue';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vaccineTypeId: string;
  vaccineName: string;
  queueItems: VaccinationQueueItem[];
}

export function ScheduleVaccinationTripDialog({ open, onOpenChange, vaccineTypeId, vaccineName, queueItems }: Props) {
  const { scheduleTrip } = useVaccinationTrips();
  const { areas } = useAreas();
  const [areaId, setAreaId] = useState<string>('');
  const { setores } = useSetores(areaId || undefined);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dataPrevista, setDataPrevista] = useState('');
  const [setorId, setSetorId] = useState<string>('');
  const [responsavelId, setResponsavelId] = useState<string>('');
  const [observacoes, setObservacoes] = useState('');
  const [profiles, setProfiles] = useState<Array<{ user_id: string; full_name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setSelected(new Set(queueItems.map(q => q.id)));
      setDataPrevista('');
      setObservacoes('');
      setAreaId('');
      setSetorId('');
      setResponsavelId('');
      supabase.from('profiles').select('user_id, full_name').eq('active', true).order('full_name')
        .then(({ data }) => setProfiles(data || []));
    }
  }, [open, queueItems]);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (selected.size === 0) {
      toast({ title: 'Selecione ao menos um aluno', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const selectedItems = queueItems.filter(q => selected.has(q.id));
    const res = await scheduleTrip({
      vaccine_type_id: vaccineTypeId,
      queue_item_ids: Array.from(selected),
      data_prevista: dataPrevista || null,
      setor_id: setorId || null,
      responsavel_id: responsavelId || null,
      observacoes: observacoes || null,
      vaccine_name: vaccineName,
      student_count: selected.size,
      student_names: selectedItems.map(q => q.student?.nome_completo || '—'),
    });
    setSaving(false);
    if (res.error) {
      toast({ title: 'Erro', description: res.error, variant: 'destructive' });
    } else {
      toast({ title: 'Agendado', description: 'Tarefa de vacinação criada.' });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agendar ida ao posto — {vaccineName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-sm">Alunos para incluir nesta ida</Label>
            <div className="mt-2 border rounded-md max-h-56 overflow-auto divide-y">
              {queueItems.map(q => (
                <label key={q.id} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted/50">
                  <Checkbox checked={selected.has(q.id)} onCheckedChange={() => toggle(q.id)} />
                  <span className="text-sm flex-1">{q.student?.nome_completo}</span>
                  <span className="text-xs text-muted-foreground">{q.student?.codigo_cadastro}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{selected.size} de {queueItems.length} selecionado(s)</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data prevista (opcional)</Label>
              <Input type="date" value={dataPrevista} onChange={e => setDataPrevista(e.target.value)} />
            </div>
            <div>
              <Label>Responsável (opcional)</Label>
              <Select value={responsavelId} onValueChange={setResponsavelId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {profiles.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Área (opcional)</Label>
              <Select value={areaId} onValueChange={(v) => { setAreaId(v); setSetorId(''); }}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {areas.map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Setor (opcional)</Label>
              <Select value={setorId} onValueChange={setSetorId} disabled={!areaId}>
                <SelectTrigger><SelectValue placeholder={areaId ? 'Selecione' : 'Escolha área'} /></SelectTrigger>
                <SelectContent>
                  {setores.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || selected.size === 0}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Criar tarefa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
