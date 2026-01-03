import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTasks, Task, TaskPriority, TaskStatus } from "@/hooks/use-tasks";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useAreas } from "@/hooks/use-areas";
import { useSetores } from "@/hooks/use-setores";
import { supabase } from "@/integrations/supabase/client";

interface TaskFormProps {
  taskId?: string | null;
  onSuccess: () => void;
}

interface UserProfile {
  user_id: string;
  full_name: string;
}

export function TaskForm({ taskId, onSuccess }: TaskFormProps) {
  const { createTask, updateTask, fetchTaskById } = useTasks();
  const { user } = useAuth();
  const { toast } = useToast();
  const { areas } = useAreas();
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const { setores } = useSetores(selectedAreaId || undefined);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [loadingTask, setLoadingTask] = useState(false);
  
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    prioridade: 'media' as TaskPriority,
    status: 'pendente' as TaskStatus,
    categoria: '',
    data_vencimento: null as Date | null,
    assigned_to: '',
    estimated_hours: '',
    setor_id: '',
  });

  const isEdit = !!taskId;

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

  // Carregar dados da tarefa para edição
  useEffect(() => {
    const loadTaskData = async () => {
      if (taskId) {
        console.log('Loading task data for editing, ID:', taskId);
        setLoadingTask(true);
        
        try {
          const task = await fetchTaskById(taskId);
          if (task) {
            console.log('Task data loaded for editing:', task);
            setCurrentTask(task);
            // Se a tarefa tem setor, preencher área e setor
            if (task.setor?.area_id) {
              setSelectedAreaId(task.setor.area_id);
            }
            setFormData({
              titulo: task.titulo,
              descricao: task.descricao || '',
              prioridade: task.prioridade,
              status: task.status,
              categoria: task.categoria || '',
              data_vencimento: task.data_vencimento ? new Date(task.data_vencimento) : null,
              assigned_to: task.assigned_to,
              estimated_hours: task.estimated_hours?.toString() || '',
              setor_id: task.setor_id || '',
            });
          } else {
            console.error('Task not found for ID:', taskId);
            toast({
              title: "Erro",
              description: "Tarefa não encontrada",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error loading task data:', error);
          toast({
            title: "Erro",
            description: "Erro ao carregar dados da tarefa",
            variant: "destructive",
          });
        } finally {
          setLoadingTask(false);
        }
      } else {
        // Resetar formulário para criação
        setLoadingTask(false);
        setCurrentTask(null);
      }
    };

    loadTaskData();
    // Remover fetchTaskById das dependências para evitar loop infinito
  }, [taskId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    // Validação no frontend
    if (!formData.titulo.trim()) {
      toast({
        title: "Erro",
        description: "Título é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!formData.assigned_to) {
      toast({
        title: "Erro", 
        description: "Responsável é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('Submitting task form with user:', user.id);
      
      const taskData = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || null,
        prioridade: formData.prioridade,
        status: formData.status,
        categoria: formData.categoria.trim() || null,
        data_vencimento: formData.data_vencimento?.toISOString() || null,
        assigned_to: formData.assigned_to,
        estimated_hours: formData.estimated_hours ? Number(formData.estimated_hours) : null,
        setor_id: formData.setor_id || null,
        created_by: user.id,
      };

      console.log('Task data to submit:', taskData);

      if (isEdit && taskId) {
        console.log('Updating existing task...');
        await updateTask(taskId, taskData);
        console.log('Task update completed, calling onSuccess...');
      } else {
        console.log('Creating new task...');
        await createTask(taskData);
        console.log('Task creation completed, calling onSuccess...');
      }

      // Wait a bit to ensure the realtime update has processed
      setTimeout(() => {
        console.log('Calling onSuccess callback');
        onSuccess();
      }, 100);
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
      // Error já tratado no hook
    } finally {
      setLoading(false);
    }
  };

  const priorityLabels = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
    urgente: "Urgente"
  };

  const statusLabels = {
    pendente: "Pendente",
    em_andamento: "Em Andamento",
    realizada: "Realizada",
    cancelada: "Cancelada",
    transferida: "Transferida"
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {loadingTask ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando dados da tarefa...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="titulo">Título *</Label>
          <Input
            id="titulo"
            value={formData.titulo}
            onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
            placeholder="Título da tarefa"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoria">Categoria</Label>
          <Input
            id="categoria"
            value={formData.categoria}
            onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
            placeholder="Ex: Desenvolvimento, Administrativo"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
          placeholder="Descrição detalhada da tarefa"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Área</Label>
          <Select 
            value={selectedAreaId} 
            onValueChange={(value) => {
              setSelectedAreaId(value);
              setFormData(prev => ({ ...prev, setor_id: '' }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a área" />
            </SelectTrigger>
            <SelectContent>
              {areas?.filter(a => a.ativo).map((area) => (
                <SelectItem key={area.id} value={area.id}>{area.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Setor</Label>
          <Select 
            value={formData.setor_id} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, setor_id: value }))}
            disabled={!selectedAreaId}
          >
            <SelectTrigger>
              <SelectValue placeholder={selectedAreaId ? "Selecione o setor" : "Selecione uma área primeiro"} />
            </SelectTrigger>
            <SelectContent>
              {setores?.filter(s => s.ativo).map((setor) => (
                <SelectItem key={setor.id} value={setor.id}>{setor.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Prioridade</Label>
          <Select 
            value={formData.prioridade} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, prioridade: value as TaskPriority }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(priorityLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isEdit && (
          <div className="space-y-2">
            <Label>Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as TaskStatus }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Horas Estimadas</Label>
          <Input
            type="number"
            min="0"
            step="0.5"
            value={formData.estimated_hours}
            onChange={(e) => setFormData(prev => ({ ...prev, estimated_hours: e.target.value }))}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label>Responsável *</Label>
          <Select 
            value={formData.assigned_to} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o responsável" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.user_id} value={user.user_id}>
                  {user.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Data de Vencimento</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.data_vencimento && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.data_vencimento ? (
                  format(formData.data_vencimento, "PPP", { locale: ptBR })
                ) : (
                  <span>Selecione a data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.data_vencimento}
                onSelect={(date) => setFormData(prev => ({ ...prev, data_vencimento: date }))}
                disabled={(date) => date < new Date()}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess}
          disabled={loading || loadingTask}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading || loadingTask}>
          {loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar')} Tarefa
        </Button>
      </div>
        </>
      )}
    </form>
  );
}