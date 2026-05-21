import { useState, useMemo, useEffect } from "react";
import { Task, TaskPriority, TaskStatus } from "@/hooks/use-tasks";
import { TaskCard } from "./task-card";
import { TaskTable } from "./task-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table2, List, Search, Filter, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAreas } from "@/hooks/use-areas";
import { useSetores } from "@/hooks/use-setores";
import { supabase } from "@/integrations/supabase/client";
import { isBefore, startOfDay } from "date-fns";

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
  onEditTask: (taskId: string) => void;
  refetch?: () => void;
}

type SortKey = "created_desc" | "due_asc" | "priority_desc" | "status";

const priorityWeight: Record<TaskPriority, number> = { urgente: 4, alta: 3, media: 2, baixa: 1 };

const isOverdue = (t: Task) =>
  !!t.data_vencimento &&
  t.status !== "realizada" && t.status !== "cancelada" && t.status !== "transferida" &&
  isBefore(new Date(t.data_vencimento), startOfDay(new Date()));

export function TaskList({ tasks, loading, onEditTask, refetch }: TaskListProps) {
  const [viewMode, setViewMode] = useState<"list" | "table">("list");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | "all">("all");
  const [areaFilter, setAreaFilter] = useState<string>("all");
  const [setorFilter, setSetorFilter] = useState<string>("all");
  const [responsibleFilter, setResponsibleFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("created_desc");
  const [users, setUsers] = useState<Array<{ user_id: string; full_name: string }>>([]);

  const { areas } = useAreas();
  const { setores } = useSetores(areaFilter !== "all" ? areaFilter : undefined);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, full_name")
        .order("full_name");
      setUsers(data || []);
    })();
  }, []);

  const filteredTasks = useMemo(() => {
    const term = searchTerm.toLowerCase();
    let list = tasks.filter(task => {
      const matchesSearch =
        !term ||
        task.titulo.toLowerCase().includes(term) ||
        task.descricao?.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || task.prioridade === priorityFilter;
      const matchesArea = areaFilter === "all" || task.setor?.area_id === areaFilter;
      const matchesSetor = setorFilter === "all" || task.setor_id === setorFilter;
      const matchesResp = responsibleFilter === "all" || task.assigned_to === responsibleFilter;
      return matchesSearch && matchesStatus && matchesPriority && matchesArea && matchesSetor && matchesResp;
    });

    // Sempre: atrasadas primeiro
    list = list.sort((a, b) => {
      const oa = isOverdue(a) ? 1 : 0;
      const ob = isOverdue(b) ? 1 : 0;
      if (oa !== ob) return ob - oa;
      switch (sortBy) {
        case "due_asc": {
          const da = a.data_vencimento ? new Date(a.data_vencimento).getTime() : Infinity;
          const db = b.data_vencimento ? new Date(b.data_vencimento).getTime() : Infinity;
          return da - db;
        }
        case "priority_desc":
          return priorityWeight[b.prioridade] - priorityWeight[a.prioridade];
        case "status":
          return a.status.localeCompare(b.status);
        case "created_desc":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    return list;
  }, [tasks, searchTerm, statusFilter, priorityFilter, areaFilter, setorFilter, responsibleFilter, sortBy]);

  const priorityLabels = { baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente" };
  const statusLabels = {
    pendente: "Pendente",
    em_andamento: "Em Andamento",
    realizada: "Realizada",
    cancelada: "Cancelada",
    transferida: "Transferida",
  };

  const hasActiveFilters =
    statusFilter !== "all" || priorityFilter !== "all" ||
    areaFilter !== "all" || setorFilter !== "all" ||
    responsibleFilter !== "all" || !!searchTerm;

  const clearAllFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setAreaFilter("all");
    setSetorFilter("all");
    setResponsibleFilter("all");
    setSearchTerm("");
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <CardTitle className="flex-1">Lista de TAREFAS</CardTitle>
          <div className="flex rounded-lg border">
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm"
              onClick={() => setViewMode("list")} className="rounded-r-none">
              <List className="h-4 w-4 mr-2" />Lista
            </Button>
            <Button variant={viewMode === "table" ? "default" : "ghost"} size="sm"
              onClick={() => setViewMode("table")} className="rounded-l-none">
              <Table2 className="h-4 w-4 mr-2" />Tabela
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Buscar tarefas..." value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>

          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as TaskStatus | "all")}>
            <SelectTrigger><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              {Object.entries(statusLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as TaskPriority | "all")}>
            <SelectTrigger><Filter className="w-4 h-4 mr-2" /><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Prioridades</SelectItem>
              {Object.entries(priorityLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={areaFilter} onValueChange={(v) => { setAreaFilter(v); setSetorFilter("all"); }}>
            <SelectTrigger><SelectValue placeholder="Área" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Áreas</SelectItem>
              {areas?.filter(a => a.ativo).map(a => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={setorFilter} onValueChange={setSetorFilter} disabled={areaFilter === "all"}>
            <SelectTrigger>
              <SelectValue placeholder={areaFilter === "all" ? "Selecione uma área" : "Setor"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Setores</SelectItem>
              {setores?.filter(s => s.ativo).map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={responsibleFilter} onValueChange={setResponsibleFilter}>
            <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Responsáveis</SelectItem>
              {users.map(u => <SelectItem key={u.user_id} value={u.user_id}>{u.full_name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger><SelectValue placeholder="Ordenar" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="created_desc">Mais recentes</SelectItem>
              <SelectItem value="due_asc">Vencimento (próximo)</SelectItem>
              <SelectItem value="priority_desc">Prioridade (maior)</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1">
              <X className="w-3.5 h-3.5" /> Limpar filtros
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {hasActiveFilters ? "Nenhuma tarefa encontrada" : "Nenhuma tarefa cadastrada"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters ? "Tente ajustar os filtros ou termo de busca" : "Comece criando sua primeira tarefa"}
            </p>
          </div>
        ) : viewMode === "list" ? (
          <div className="space-y-4">
            {filteredTasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={() => onEditTask(task.id)} onStatusChange={refetch} />
            ))}
          </div>
        ) : (
          <TaskTable tasks={filteredTasks} onEditTask={onEditTask} onStatusChange={refetch} />
        )}
      </CardContent>
    </Card>
  );
}
