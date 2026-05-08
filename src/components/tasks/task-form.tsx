import { useState, useEffect, useMemo } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useTasks, Task, TaskPriority, TaskStatus } from "@/hooks/use-tasks";
import { useAuth } from "@/hooks/use-auth";
import { useAreas } from "@/hooks/use-areas";
import { useSetores } from "@/hooks/use-setores";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TaskFormProps {
  taskId?: string | null;
  onSuccess: () => void;
}

interface UserProfile {
  user_id: string;
  full_name: string;
  active?: boolean;
}

const taskSchema = z.object({
  titulo: z.string().trim().min(1, "Título é obrigatório").max(200, "Máximo 200 caracteres"),
  descricao: z.string().trim().max(2000).optional().nullable(),
  prioridade: z.enum(["baixa", "media", "alta", "urgente"]),
  status: z.enum(["pendente", "em_andamento", "realizada", "cancelada", "transferida"]),
  categoria: z.string().trim().max(100).optional().nullable(),
  data_vencimento: z.date().nullable(),
  assigned_to: z.string().uuid("Responsável é obrigatório"),
  estimated_hours: z.string().optional(),
  setor_id: z.string().optional(),
});

const INITIAL_FORM = {
  titulo: "",
  descricao: "",
  prioridade: "media" as TaskPriority,
  status: "pendente" as TaskStatus,
  categoria: "",
  data_vencimento: null as Date | null,
  assigned_to: "",
  estimated_hours: "",
  setor_id: "",
};

export function TaskForm({ taskId, onSuccess }: TaskFormProps) {
  const { createTask, updateTask, fetchTaskById } = useTasks();
  const { user } = useAuth();
  const { areas } = useAreas();
  const [selectedAreaId, setSelectedAreaId] = useState<string>("");
  const { setores } = useSetores(selectedAreaId || undefined);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingTask, setLoadingTask] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  const isEdit = !!taskId;

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name, active")
        .order("full_name");
      setUsers(data || []);
    })();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!taskId) {
        setFormData(INITIAL_FORM);
        setSelectedAreaId("");
        setLoadingTask(false);
        return;
      }
      setLoadingTask(true);
      try {
        const task = await fetchTaskById(taskId);
        if (task) {
          if (task.setor?.area_id) setSelectedAreaId(task.setor.area_id);
          setFormData({
            titulo: task.titulo,
            descricao: task.descricao || "",
            prioridade: task.prioridade,
            status: task.status,
            categoria: task.categoria || "",
            data_vencimento: task.data_vencimento ? new Date(task.data_vencimento) : null,
            assigned_to: task.assigned_to,
            estimated_hours: task.estimated_hours?.toString() || "",
            setor_id: task.setor_id || "",
          });
        } else {
          toast.error("Tarefa não encontrada");
        }
      } finally {
        setLoadingTask(false);
      }
    };
    load();
  }, [taskId]);

  // Garantir que o responsável atual aparece no select mesmo se inativo
  const userOptions = useMemo(() => {
    const list = users.filter(u => u.active !== false);
    if (formData.assigned_to && !list.some(u => u.user_id === formData.assigned_to)) {
      const inactive = users.find(u => u.user_id === formData.assigned_to);
      if (inactive) list.push({ ...inactive, full_name: `${inactive.full_name} (inativo)` });
    }
    return list;
  }, [users, formData.assigned_to]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const result = taskSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Dados inválidos");
      return;
    }

    setLoading(true);
    try {
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

      if (isEdit && taskId) {
        await updateTask(taskId, taskData);
      } else {
        await createTask(taskData);
      }
      onSuccess();
    } catch {
      // toasts já tratados
    } finally {
      setLoading(false);
    }
  };

  const priorityLabels = { baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente" };
  const statusLabels = {
    pendente: "Pendente",
    em_andamento: "Em Andamento",
    realizada: "Realizada",
    cancelada: "Cancelada",
    transferida: "Transferida",
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
                  setFormData(prev => ({ ...prev, setor_id: "" }));
                }}
              >
                <SelectTrigger><SelectValue placeholder="Selecione a área" /></SelectTrigger>
                <SelectContent>
                  {areas?.filter(a => a.ativo).map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
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
                  {setores?.filter(s => s.ativo).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
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
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                  <SelectTrigger><SelectValue /></SelectTrigger>
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
                <SelectTrigger><SelectValue placeholder="Selecione o responsável" /></SelectTrigger>
                <SelectContent>
                  {userOptions.map((u) => (
                    <SelectItem key={u.user_id} value={u.user_id}>{u.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.data_vencimento && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.data_vencimento
                      ? format(formData.data_vencimento, "PPP", { locale: ptBR })
                      : <span>Selecione a data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.data_vencimento}
                    onSelect={(date) => setFormData(prev => ({ ...prev, data_vencimento: date }))}
                    disabled={(date) => date < startOfDay(new Date())}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onSuccess} disabled={loading || loadingTask}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || loadingTask}>
              {loading ? "Salvando..." : isEdit ? "Atualizar Tarefa" : "Criar Tarefa"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
