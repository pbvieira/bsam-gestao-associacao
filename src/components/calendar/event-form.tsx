import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCalendar, CalendarEvent, EventType, RecurrenceType } from "@/hooks/use-calendar";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface EventFormProps {
  eventId?: string | null;
  selectedDate?: Date | null;
  onSuccess: () => void;
}

interface UserProfile {
  user_id: string;
  full_name: string;
}

export function EventForm({ eventId, selectedDate, onSuccess }: EventFormProps) {
  const { createEvent, updateEvent, events } = useCalendar();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'evento' as EventType,
    data_inicio: selectedDate || new Date(),
    data_fim: selectedDate || new Date(),
    hora_inicio: '09:00',
    hora_fim: '10:00',
    all_day: false,
    recurrence_type: 'none' as RecurrenceType,
    recurrence_end: null as Date | null,
    location: '',
  });

  const isEdit = !!eventId;
  const currentEvent = isEdit ? events.find(e => e.id === eventId) : null;

  // Carregar usuários
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .eq('active', true)
          .order('full_name');

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Erro ao carregar usuários:', error);
      }
    };

    fetchUsers();
  }, []);

  // Carregar dados do evento para edição
  useEffect(() => {
    if (currentEvent) {
      const startDate = new Date(currentEvent.data_inicio);
      const endDate = new Date(currentEvent.data_fim);
      
      setFormData({
        titulo: currentEvent.titulo,
        descricao: currentEvent.descricao || '',
        tipo: currentEvent.tipo,
        data_inicio: startDate,
        data_fim: endDate,
        hora_inicio: currentEvent.all_day ? '09:00' : format(startDate, 'HH:mm'),
        hora_fim: currentEvent.all_day ? '10:00' : format(endDate, 'HH:mm'),
        all_day: currentEvent.all_day,
        recurrence_type: currentEvent.recurrence_type,
        recurrence_end: currentEvent.recurrence_end ? new Date(currentEvent.recurrence_end) : null,
        location: currentEvent.location || '',
      });

      // Carregar participantes
      if (currentEvent.participants) {
        setSelectedParticipants(
          currentEvent.participants
            .filter(p => !p.is_organizer)
            .map(p => p.user_id)
        );
      }
    }
  }, [currentEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Combinar data e hora
      let dataInicio: Date;
      let dataFim: Date;

      if (formData.all_day) {
        dataInicio = new Date(formData.data_inicio);
        dataInicio.setHours(0, 0, 0, 0);
        
        dataFim = new Date(formData.data_fim);
        dataFim.setHours(23, 59, 59, 999);
      } else {
        const [horaInicio, minutoInicio] = formData.hora_inicio.split(':').map(Number);
        const [horaFim, minutoFim] = formData.hora_fim.split(':').map(Number);

        dataInicio = new Date(formData.data_inicio);
        dataInicio.setHours(horaInicio, minutoInicio, 0, 0);

        dataFim = new Date(formData.data_fim);
        dataFim.setHours(horaFim, minutoFim, 0, 0);
      }

      const eventData = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || null,
        tipo: formData.tipo,
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        all_day: formData.all_day,
        recurrence_type: formData.recurrence_type,
        recurrence_end: formData.recurrence_end?.toISOString() || null,
        location: formData.location.trim() || null,
        created_by: user.id,
      };

      if (isEdit && eventId) {
        await updateEvent(eventId, eventData);
      } else {
        await createEvent(eventData, selectedParticipants);
      }

      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
    } finally {
      setLoading(false);
    }
  };

  const typeLabels = {
    reuniao: "Reunião",
    atendimento: "Atendimento",
    evento: "Evento",
    lembrete: "Lembrete"
  };

  const recurrenceLabels = {
    none: "Não repetir",
    daily: "Diariamente",
    weekly: "Semanalmente",
    monthly: "Mensalmente"
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="titulo">Título *</Label>
          <Input
            id="titulo"
            value={formData.titulo}
            onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
            placeholder="Título do evento"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select 
            value={formData.tipo} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value as EventType }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(typeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
          placeholder="Descrição do evento"
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Local</Label>
        <Input
          id="location"
          value={formData.location}
          onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
          placeholder="Local do evento"
        />
      </div>

      {/* All Day Toggle */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="all_day"
          checked={formData.all_day}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, all_day: !!checked }))}
        />
        <Label htmlFor="all_day">Evento de dia inteiro</Label>
      </div>

      {/* Data e Hora */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Data de Início</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.data_inicio && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(formData.data_inicio, "PPP", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.data_inicio}
                onSelect={(date) => date && setFormData(prev => ({ ...prev, data_inicio: date }))}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Data de Fim</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.data_fim && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(formData.data_fim, "PPP", { locale: ptBR })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.data_fim}
                onSelect={(date) => date && setFormData(prev => ({ ...prev, data_fim: date }))}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {!formData.all_day && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hora_inicio">Hora de Início</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="hora_inicio"
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => setFormData(prev => ({ ...prev, hora_inicio: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hora_fim">Hora de Fim</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="hora_fim"
                type="time"
                value={formData.hora_fim}
                onChange={(e) => setFormData(prev => ({ ...prev, hora_fim: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      )}

      {/* Recorrência */}
      <div className="space-y-2">
        <Label>Repetir</Label>
        <Select 
          value={formData.recurrence_type} 
          onValueChange={(value) => setFormData(prev => ({ ...prev, recurrence_type: value as RecurrenceType }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(recurrenceLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {formData.recurrence_type !== 'none' && (
        <div className="space-y-2">
          <Label>Repetir até</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.recurrence_end && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.recurrence_end ? (
                  format(formData.recurrence_end, "PPP", { locale: ptBR })
                ) : (
                  <span>Selecione a data final</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.recurrence_end}
                onSelect={(date) => setFormData(prev => ({ ...prev, recurrence_end: date }))}
                disabled={(date) => date < formData.data_inicio}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      )}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar')} Evento
        </Button>
      </div>
    </form>
  );
}