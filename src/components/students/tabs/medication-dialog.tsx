import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Clock, Calendar } from 'lucide-react';
import { useMedicationUsageTypes } from '@/hooks/use-medication-usage-types';
import { useSetores } from '@/hooks/use-setores';
import { StudentMedication, MedicationInput, ScheduleInput } from '@/hooks/use-student-medications';
import { toast } from 'sonner';

interface MedicationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medication?: StudentMedication | null;
  onSave: (data: MedicationInput, schedules: ScheduleInput[]) => Promise<{ error: string | null }>;
}

const FORMAS_FARMACEUTICAS = [
  'Comprimido',
  'Cápsula',
  'Solução Oral',
  'Suspensão',
  'Xarope',
  'Gotas',
  'Injetável',
  'Pomada',
  'Creme',
  'Gel',
  'Spray',
  'Adesivo',
  'Supositório',
  'Outro'
];

const FREQUENCIAS = [
  { value: 'diaria', label: 'Diária' },
  { value: 'dias_alternados', label: 'Dias Alternados' },
  { value: 'semanal', label: 'Semanal' }
];

const DIAS_SEMANA = [
  { value: 'seg', label: 'Seg' },
  { value: 'ter', label: 'Ter' },
  { value: 'qua', label: 'Qua' },
  { value: 'qui', label: 'Qui' },
  { value: 'sex', label: 'Sex' },
  { value: 'sab', label: 'Sáb' },
  { value: 'dom', label: 'Dom' }
];

export function MedicationDialog({ open, onOpenChange, medication, onSave }: MedicationDialogProps) {
  const { types } = useMedicationUsageTypes();
  const { setores } = useSetores();
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<MedicationInput>({
    nome_medicamento: '',
    principio_ativo: '',
    dosagem: '',
    forma_farmaceutica: '',
    tipo_uso_id: '',
    prescrito_por: '',
    data_inicio: '',
    data_fim: '',
    observacoes: ''
  });

  const [schedules, setSchedules] = useState<ScheduleInput[]>([]);

  // Check if selected type is "Contínuo"
  const selectedType = types.find(t => t.id === formData.tipo_uso_id);
  const isContinuousType = selectedType?.nome?.toLowerCase().includes('contínuo') || 
                           selectedType?.nome?.toLowerCase().includes('continuo');

  useEffect(() => {
    if (medication) {
      setFormData({
        nome_medicamento: medication.nome_medicamento,
        principio_ativo: medication.principio_ativo || '',
        dosagem: medication.dosagem || '',
        forma_farmaceutica: medication.forma_farmaceutica || '',
        tipo_uso_id: medication.tipo_uso_id || '',
        prescrito_por: medication.prescrito_por || '',
        data_inicio: medication.data_inicio || '',
        data_fim: medication.data_fim || '',
        observacoes: medication.observacoes || ''
      });
      setSchedules(
        medication.schedules?.map(s => ({
          horario: s.horario,
          frequencia: s.frequencia,
          dias_semana: s.dias_semana || [],
          instrucoes: s.instrucoes || '',
          gerar_evento: s.gerar_evento,
          setor_responsavel_id: s.setor_responsavel_id || ''
        })) || []
      );
    } else {
      setFormData({
        nome_medicamento: '',
        principio_ativo: '',
        dosagem: '',
        forma_farmaceutica: '',
        tipo_uso_id: '',
        prescrito_por: '',
        data_inicio: '',
        data_fim: '',
        observacoes: ''
      });
      setSchedules([]);
    }
  }, [medication, open]);

  // Clear data_fim when type changes to continuous
  useEffect(() => {
    if (isContinuousType && formData.data_fim) {
      setFormData(prev => ({ ...prev, data_fim: '' }));
    }
  }, [isContinuousType]);

  const addSchedule = () => {
    setSchedules([...schedules, {
      horario: '08:00',
      frequencia: 'diaria',
      dias_semana: [],
      instrucoes: '',
      gerar_evento: false,
      setor_responsavel_id: ''
    }]);
  };

  const removeSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const updateSchedule = (index: number, field: keyof ScheduleInput, value: any) => {
    const updated = [...schedules];
    updated[index] = { ...updated[index], [field]: value };
    setSchedules(updated);
  };

  const toggleDia = (index: number, dia: string) => {
    const updated = [...schedules];
    const dias = updated[index].dias_semana || [];
    if (dias.includes(dia)) {
      updated[index].dias_semana = dias.filter(d => d !== dia);
    } else {
      updated[index].dias_semana = [...dias, dia];
    }
    setSchedules(updated);
  };

  const handleSubmit = async () => {
    if (!formData.nome_medicamento.trim()) {
      toast.error('Nome do medicamento é obrigatório');
      return;
    }

    setSaving(true);
    const result = await onSave(formData, schedules);
    setSaving(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(medication ? 'Medicamento atualizado' : 'Medicamento cadastrado');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {medication ? 'Editar Medicamento' : 'Novo Medicamento'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="nome_medicamento">Nome do Medicamento *</Label>
              <Input
                id="nome_medicamento"
                value={formData.nome_medicamento}
                onChange={(e) => setFormData({ ...formData, nome_medicamento: e.target.value })}
                placeholder="Ex: Rivotril"
              />
            </div>
            <div>
              <Label htmlFor="principio_ativo">Princípio Ativo</Label>
              <Input
                id="principio_ativo"
                value={formData.principio_ativo}
                onChange={(e) => setFormData({ ...formData, principio_ativo: e.target.value })}
                placeholder="Ex: Clonazepam"
              />
            </div>
            <div>
              <Label htmlFor="dosagem">Dosagem</Label>
              <Input
                id="dosagem"
                value={formData.dosagem}
                onChange={(e) => setFormData({ ...formData, dosagem: e.target.value })}
                placeholder="Ex: 2mg"
              />
            </div>
            <div>
              <Label>Forma Farmacêutica</Label>
              <Select
                value={formData.forma_farmaceutica}
                onValueChange={(value) => setFormData({ ...formData, forma_farmaceutica: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {FORMAS_FARMACEUTICAS.map((forma) => (
                    <SelectItem key={forma} value={forma}>{forma}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Uso</Label>
              <Select
                value={formData.tipo_uso_id}
                onValueChange={(value) => setFormData({ ...formData, tipo_uso_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {types.filter(t => t.ativo).map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: type.cor }}
                        />
                        {type.nome}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="prescrito_por">Prescrito Por</Label>
              <Input
                id="prescrito_por"
                value={formData.prescrito_por}
                onChange={(e) => setFormData({ ...formData, prescrito_por: e.target.value })}
                placeholder="Nome do médico"
              />
            </div>
            <div>
              <Label htmlFor="data_inicio">Data Início</Label>
              <Input
                id="data_inicio"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="data_fim">Data Fim</Label>
              {isContinuousType ? (
                <div className="flex items-center h-10 px-3 text-sm text-muted-foreground bg-muted rounded-md border">
                  Uso contínuo - sem data de término
                </div>
              ) : (
                <Input
                  id="data_fim"
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                />
              )}
            </div>
            <div className="col-span-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais"
                rows={2}
              />
            </div>
          </div>

          {/* Schedules */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Horários de Administração
                </CardTitle>
                <Button variant="outline" size="sm" onClick={addSchedule}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Horário
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {schedules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum horário cadastrado. Clique em "Adicionar Horário" para definir quando o medicamento deve ser administrado.
                </p>
              ) : (
                schedules.map((schedule, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Horário {index + 1}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSchedule(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Horário</Label>
                        <Input
                          type="time"
                          value={schedule.horario}
                          onChange={(e) => updateSchedule(index, 'horario', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Frequência</Label>
                        <Select
                          value={schedule.frequencia}
                          onValueChange={(value) => updateSchedule(index, 'frequencia', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {FREQUENCIAS.map((f) => (
                              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {schedule.frequencia === 'semanal' && (
                      <div>
                        <Label>Dias da Semana</Label>
                        <div className="flex gap-1 mt-2">
                          {DIAS_SEMANA.map((dia) => (
                            <Button
                              key={dia.value}
                              type="button"
                              variant={schedule.dias_semana?.includes(dia.value) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => toggleDia(index, dia.value)}
                            >
                              {dia.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <Label>Instruções</Label>
                      <Input
                        value={schedule.instrucoes || ''}
                        onChange={(e) => updateSchedule(index, 'instrucoes', e.target.value)}
                        placeholder="Ex: Antes do café, após o almoço..."
                      />
                    </div>

                    <div className="border-t pt-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={schedule.gerar_evento}
                          onCheckedChange={(checked) => updateSchedule(index, 'gerar_evento', checked)}
                        />
                        <div>
                          <Label className="cursor-pointer">Gerar evento no calendário</Label>
                          <p className="text-xs text-muted-foreground">
                            Cria um lembrete recorrente para administração
                          </p>
                        </div>
                      </div>

                      {schedule.gerar_evento && (
                        <div>
                          <Label>Setor Responsável</Label>
                          <Select
                            value={schedule.setor_responsavel_id || ''}
                            onValueChange={(value) => updateSchedule(index, 'setor_responsavel_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o setor" />
                            </SelectTrigger>
                            <SelectContent>
                              {setores.filter(s => s.ativo).map((setor) => (
                                <SelectItem key={setor.id} value={setor.id}>
                                  {setor.nome}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? 'Salvando...' : medication ? 'Salvar' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
