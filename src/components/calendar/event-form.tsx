import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Clock, Users, Mail, X, Plus, FileText, Calendar as CalendarTabIcon, UserCheck, UserX, UserMinus } from "lucide-react";
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

interface ExternalParticipant {
  email: string;
  name: string;
}

export function EventForm({ eventId, selectedDate, onSuccess }: EventFormProps) {
  const { createEvent, updateEvent, events, refetch } = useCalendar();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [externalParticipants, setExternalParticipants] = useState<ExternalParticipant[]>([]);
  const [newExternalParticipant, setNewExternalParticipant] = useState({ name: '', email: '' });
  
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

  // Initialize form data based on selectedDate (only for new events)
  useEffect(() => {
    if (selectedDate && !isEdit) {
      // Criar data local sem problemas de timezone
      const localDate = new Date(
        selectedDate.getFullYear(), 
        selectedDate.getMonth(), 
        selectedDate.getDate()
      );
      
      setFormData(prev => ({
        ...prev,
        data_inicio: localDate,
        data_fim: localDate,
        hora_inicio: '09:00',
        hora_fim: '10:00'
      }));
    }
  }, [selectedDate, isEdit]);

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

  // Carregar dados do evento para edição (only for edit mode)
  useEffect(() => {
    if (currentEvent && isEdit) {
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

      // Carregar participantes internos
      if (currentEvent.participants) {
        setSelectedParticipants(
          currentEvent.participants
            .filter(p => !p.is_organizer)
            .map(p => p.user_id)
        );
      }

      // Carregar participantes externos
      if (currentEvent.external_participants) {
        setExternalParticipants(
          currentEvent.external_participants.map(ep => ({
            name: ep.name,
            email: ep.email
          }))
        );
      }
    }
  }, [currentEvent, isEdit]);

  // Funções para gerenciar participantes externos
  const addExternalParticipant = () => {
    if (newExternalParticipant.name.trim() && newExternalParticipant.email.trim()) {
      // Validar email básico
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newExternalParticipant.email.trim())) {
        alert('Por favor, insira um email válido');
        return;
      }
      
      // Verificar se já existe
      if (externalParticipants.some(p => p.email.toLowerCase() === newExternalParticipant.email.toLowerCase().trim())) {
        alert('Este email já foi adicionado');
        return;
      }

      setExternalParticipants([...externalParticipants, { 
        name: newExternalParticipant.name.trim(),
        email: newExternalParticipant.email.toLowerCase().trim()
      }]);
      setNewExternalParticipant({ name: '', email: '' });
    }
  };

  const removeExternalParticipant = (index: number) => {
    setExternalParticipants(externalParticipants.filter((_, i) => i !== index));
  };

  const toggleParticipant = (userId: string) => {
    setSelectedParticipants(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

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
        // Atualizar evento
        await updateEvent(eventId, eventData);
        
        // Atualizar participantes internos
        // 1. Deletar participantes existentes (exceto organizador)
        await supabase
          .from('event_participants')
          .delete()
          .eq('event_id', eventId)
          .eq('is_organizer', false);
        
        // 2. Adicionar novos participantes
        if (selectedParticipants.length > 0) {
          const participantsToAdd = selectedParticipants.map(userId => ({
            event_id: eventId,
            user_id: userId,
            status: 'pendente' as const,
            is_organizer: false
          }));
          
          await supabase
            .from('event_participants')
            .insert(participantsToAdd);
        }
        
        // Atualizar participantes externos
        // 1. Deletar existentes
        await supabase
          .from('external_event_participants')
          .delete()
          .eq('event_id', eventId);
        
        // 2. Adicionar novos
        if (externalParticipants.length > 0) {
          const externalData = externalParticipants.map(ext => ({
            event_id: eventId,
            name: ext.name,
            email: ext.email,
            status: 'pendente' as const
          }));
          
          await supabase
            .from('external_event_participants')
            .insert(externalData);
        }
      } else {
        await createEvent(eventData, selectedParticipants, externalParticipants);
      }

      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar evento:', error);
      // O erro já é tratado no hook use-calendar com toast
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

  const totalParticipants = selectedParticipants.length + externalParticipants.length;

  return (
    <form onSubmit={handleSubmit} className="max-h-[90vh] overflow-hidden">
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="info" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Informações do Evento
          </TabsTrigger>
          <TabsTrigger value="participants" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Participantes {totalParticipants > 0 && `(${totalParticipants})`}
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[70vh] mt-4">
          <div className="space-y-6 pr-6">
            <TabsContent value="info" className="space-y-4 mt-0">
              {/* Título e Tipo */}
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

              {/* Datas */}
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
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, data_inicio: date, data_fim: date }))}
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

              {/* Checkbox Evento de Dia Inteiro */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="all_day"
                  checked={formData.all_day}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, all_day: !!checked }))}
                />
                <Label htmlFor="all_day">Evento de dia inteiro</Label>
              </div>

              {/* Horários (condicionais) */}
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

              {/* Local */}
              <div className="space-y-2">
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="Local do evento"
                />
              </div>

              {/* Descrição */}
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

              {/* Repetir Até (condicional) */}
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
                        {formData.recurrence_end ? format(formData.recurrence_end, "PPP", { locale: ptBR }) : "Selecionar data"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.recurrence_end}
                        onSelect={(date) => setFormData(prev => ({ ...prev, recurrence_end: date }))}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              )}
            </TabsContent>

            <TabsContent value="participants" className="space-y-4 mt-0">
              {/* Exibir participantes atuais - MODO VISUALIZAÇÃO */}
              {isEdit && currentEvent && (
                <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                  <Label className="text-base font-medium">Participantes do Evento</Label>
                  
                  {/* Organizador */}
                  {currentEvent.created_by_profile && (
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-primary">
                        <UserCheck className="w-3 h-3 mr-1" />
                        Organizador
                      </Badge>
                      <span className="text-sm font-medium">{currentEvent.created_by_profile.full_name}</span>
                    </div>
                  )}
                  
                  {/* Participantes internos com status */}
                  {currentEvent.participants?.filter(p => !p.is_organizer).map((p) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <Badge 
                        variant={p.status === 'aceito' ? 'default' : p.status === 'recusado' ? 'destructive' : 'secondary'}
                        className={cn(
                          p.status === 'aceito' && "bg-green-600 hover:bg-green-700"
                        )}
                      >
                        {p.status === 'aceito' ? (
                          <><UserCheck className="w-3 h-3 mr-1" />Confirmado</>
                        ) : p.status === 'recusado' ? (
                          <><UserX className="w-3 h-3 mr-1" />Recusado</>
                        ) : (
                          <><UserMinus className="w-3 h-3 mr-1" />Pendente</>
                        )}
                      </Badge>
                      <span className="text-sm">{p.user_profile?.full_name || 'Usuário'}</span>
                    </div>
                  ))}
                  
                  {/* Participantes externos com status */}
                  {currentEvent.external_participants?.map((ext) => (
                    <div key={ext.id} className="flex items-center gap-2">
                      <Badge 
                        variant={ext.status === 'aceito' ? 'default' : ext.status === 'recusado' ? 'destructive' : 'secondary'}
                        className={cn(
                          ext.status === 'aceito' && "bg-green-600 hover:bg-green-700"
                        )}
                      >
                        {ext.status === 'aceito' ? (
                          <><UserCheck className="w-3 h-3 mr-1" />Confirmado</>
                        ) : ext.status === 'recusado' ? (
                          <><UserX className="w-3 h-3 mr-1" />Recusado</>
                        ) : (
                          <><UserMinus className="w-3 h-3 mr-1" />Pendente</>
                        )}
                      </Badge>
                      <span className="text-sm">{ext.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {ext.email}
                      </span>
                    </div>
                  ))}
                  
                  {/* Mensagem se não houver participantes além do organizador */}
                  {(!currentEvent.participants || currentEvent.participants.filter(p => !p.is_organizer).length === 0) && 
                   (!currentEvent.external_participants || currentEvent.external_participants.length === 0) && (
                    <p className="text-sm text-muted-foreground">Nenhum participante convidado ainda.</p>
                  )}
                  
                  <Separator className="my-2" />
                </div>
              )}

              {/* Usuários Internos */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Usuários do Sistema</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-background">
                  {users.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Carregando usuários...</p>
                  ) : (
                    <div className="space-y-2">
                      {users.filter(u => u.user_id !== user?.id).map((userProfile) => (
                        <div key={userProfile.user_id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`user-${userProfile.user_id}`}
                            checked={selectedParticipants.includes(userProfile.user_id)}
                            onCheckedChange={() => toggleParticipant(userProfile.user_id)}
                          />
                          <Label 
                            htmlFor={`user-${userProfile.user_id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {userProfile.full_name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {selectedParticipants.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedParticipants.map(userId => {
                      const user = users.find(u => u.user_id === userId);
                      return user ? (
                        <Badge key={userId} variant="secondary" className="text-xs">
                          {user.full_name}
                          <X 
                            className="w-3 h-3 ml-1 cursor-pointer" 
                            onClick={() => toggleParticipant(userId)}
                          />
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>

              {/* Participantes Externos */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Participantes Externos</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <Input
                    placeholder="Nome completo"
                    value={newExternalParticipant.name}
                    onChange={(e) => setNewExternalParticipant(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newExternalParticipant.email}
                    onChange={(e) => setNewExternalParticipant(prev => ({ ...prev, email: e.target.value }))}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addExternalParticipant}
                    disabled={!newExternalParticipant.name.trim() || !newExternalParticipant.email.trim()}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
                
                {externalParticipants.length > 0 && (
                  <div className="space-y-2 mt-3">
                    <p className="text-sm text-muted-foreground">Participantes externos adicionados:</p>
                    <div className="space-y-1">
                      {externalParticipants.map((participant, index) => (
                        <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            <span className="text-sm">
                              <strong>{participant.name}</strong> - {participant.email}
                            </span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExternalParticipant(index)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </ScrollArea>

        <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button 
            type="submit" 
            disabled={loading}
          >
            {loading ? "Salvando..." : (isEdit ? "Atualizar" : "Criar")} Evento
          </Button>
        </div>
      </Tabs>
    </form>
  );
}