import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export type PendencyPriority = "baixa" | "media" | "alta" | "urgente";
export type PendencyAcceptance = "pendente" | "aceita" | "rejeitada";
export type PendencyColumnKind = "open" | "done" | "rejected" | "blocked";

export interface PendencyBoard {
  id: string;
  nome: string;
  descricao: string | null;
  cor: string | null;
  is_default: boolean;
  ativo: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PendencyColumn {
  id: string;
  board_id: string;
  nome: string;
  cor: string | null;
  posicao: number;
  wip_limit: number | null;
  is_final: boolean;
  kind: PendencyColumnKind;
}

export interface PendencyCategory {
  id: string;
  nome: string;
  cor: string | null;
  ativo: boolean;
}

export interface Pendency {
  id: string;
  board_id: string;
  column_id: string;
  posicao: number;
  titulo: string;
  descricao: string | null;
  solicitante_id: string | null;
  responsavel_id: string | null;
  area_id: string | null;
  setor_id: string | null;
  categoria_id: string | null;
  prioridade: PendencyPriority;
  status_aceite: PendencyAcceptance;
  data_aceite: string | null;
  motivo_rejeicao: string | null;
  prazo: string | null;
  data_entrega: string | null;
  dep_setor_id: string | null;
  dep_responsavel_id: string | null;
  dep_descricao: string | null;
  esforco_estimado: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PendencyComment {
  id: string;
  pendency_id: string;
  autor_id: string | null;
  texto: string;
  created_at: string;
}

export interface PendencyActivity {
  id: string;
  pendency_id: string;
  autor_id: string | null;
  acao: string;
  payload: any;
  created_at: string;
}

export interface PendencyChecklistItem {
  id: string;
  pendency_id: string;
  texto: string;
  concluido: boolean;
  posicao: number;
}

// =========== Boards ===========
export function usePendencyBoards() {
  return useQuery({
    queryKey: ["pendency_boards"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pendency_boards")
        .select("*")
        .eq("ativo", true)
        .order("is_default", { ascending: false })
        .order("nome");
      if (error) throw error;
      return (data ?? []) as PendencyBoard[];
    },
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: { nome: string; descricao?: string; cor?: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("pendency_boards")
        .insert({ ...input, created_by: u.user?.id })
        .select()
        .single();
      if (error) throw error;
      // Cria colunas padrão
      const cols = [
        { nome: "Backlog", cor: "#94a3b8", posicao: 0, kind: "open" as const, is_final: false },
        { nome: "Em Análise", cor: "#f59e0b", posicao: 1, kind: "open" as const, is_final: false },
        { nome: "Em Execução", cor: "#3b82f6", posicao: 2, kind: "open" as const, is_final: false },
        { nome: "Bloqueada", cor: "#ef4444", posicao: 3, kind: "blocked" as const, is_final: false },
        { nome: "Concluída", cor: "#22c55e", posicao: 4, kind: "done" as const, is_final: true },
        { nome: "Rejeitada", cor: "#71717a", posicao: 5, kind: "rejected" as const, is_final: true },
      ];
      await supabase.from("pendency_columns").insert(cols.map(c => ({ ...c, board_id: data.id })));
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendency_boards"] });
      qc.invalidateQueries({ queryKey: ["pendency_columns"] });
      toast({ title: "Quadro criado" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { id: string; nome?: string; descricao?: string; cor?: string; ativo?: boolean }) => {
      const { id, ...rest } = p;
      const { error } = await supabase.from("pendency_boards").update(rest).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pendency_boards"] }),
  });
}

export function useDeleteBoard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pendency_boards").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendency_boards"] });
      toast({ title: "Quadro excluído" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

// =========== Columns ===========
export function usePendencyColumns(boardId?: string) {
  return useQuery({
    queryKey: ["pendency_columns", boardId],
    enabled: !!boardId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pendency_columns")
        .select("*")
        .eq("board_id", boardId!)
        .order("posicao");
      if (error) throw error;
      return (data ?? []) as PendencyColumn[];
    },
  });
}

export function useUpsertColumn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (col: Partial<PendencyColumn> & { board_id: string; nome: string; posicao: number }) => {
      if (col.id) {
        const { id, ...rest } = col;
        const { error } = await supabase.from("pendency_columns").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pendency_columns").insert(col as any);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["pendency_columns", v.board_id] }),
  });
}

export function useDeleteColumn() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async ({ id }: { id: string; board_id: string }) => {
      const { error } = await supabase.from("pendency_columns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["pendency_columns", v.board_id] });
      toast({ title: "Coluna excluída" });
    },
    onError: (e: any) => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
  });
}

// =========== Pendencies ===========
export function usePendencies(boardId?: string) {
  return useQuery({
    queryKey: ["pendencies", boardId],
    enabled: !!boardId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pendencies")
        .select("*")
        .eq("board_id", boardId!)
        .order("posicao");
      if (error) throw error;
      return (data ?? []) as Pendency[];
    },
  });
}

export function useCreatePendency() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (input: Partial<Pendency> & { board_id: string; column_id: string; titulo: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const payload = {
        ...input,
        created_by: u.user?.id,
        solicitante_id: input.solicitante_id ?? u.user?.id,
      };
      const { data, error } = await supabase.from("pendencies").insert(payload as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["pendencies", v.board_id] });
      toast({ title: "Pendência criada" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useUpdatePendency() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (p: Partial<Pendency> & { id: string }) => {
      const { id, ...rest } = p;
      const { error } = await supabase.from("pendencies").update(rest as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["pendencies"] });
      qc.invalidateQueries({ queryKey: ["pendency_activity", v.id] });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

export function useMovePendency() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (p: { id: string; column_id: string; targetKind: PendencyColumnKind; motivo_rejeicao?: string | null }) => {
      const updates: any = { column_id: p.column_id };
      if (p.targetKind === "rejected") {
        if (!p.motivo_rejeicao || !p.motivo_rejeicao.trim()) {
          throw new Error("Motivo da rejeição é obrigatório.");
        }
        updates.motivo_rejeicao = p.motivo_rejeicao.trim();
      }
      const { error } = await supabase.from("pendencies").update(updates).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["pendencies"] });
      qc.invalidateQueries({ queryKey: ["pendency_activity", v.id] });
    },
    onError: (e: any) => toast({ title: "Erro ao mover", description: e.message, variant: "destructive" }),
  });
}

export function useDeletePendency() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("pendencies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pendencies"] });
      toast({ title: "Pendência excluída" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
}

// =========== Categories ===========
export function usePendencyCategories() {
  return useQuery({
    queryKey: ["pendency_categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pendency_categories")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as PendencyCategory[];
    },
  });
}

// =========== Comments ===========
export function usePendencyComments(pendencyId?: string) {
  return useQuery({
    queryKey: ["pendency_comments", pendencyId],
    enabled: !!pendencyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pendency_comments")
        .select("*")
        .eq("pendency_id", pendencyId!)
        .order("created_at");
      if (error) throw error;
      return (data ?? []) as PendencyComment[];
    },
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { pendency_id: string; texto: string }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("pendency_comments").insert({ ...p, autor_id: u.user?.id });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["pendency_comments", v.pendency_id] }),
  });
}

// =========== Activity log ===========
export function usePendencyActivity(pendencyId?: string) {
  return useQuery({
    queryKey: ["pendency_activity", pendencyId],
    enabled: !!pendencyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pendency_activity_log")
        .select("*")
        .eq("pendency_id", pendencyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PendencyActivity[];
    },
  });
}

// =========== Checklist ===========
export function usePendencyChecklist(pendencyId?: string) {
  return useQuery({
    queryKey: ["pendency_checklist", pendencyId],
    enabled: !!pendencyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pendency_checklist_items")
        .select("*")
        .eq("pendency_id", pendencyId!)
        .order("posicao");
      if (error) throw error;
      return (data ?? []) as PendencyChecklistItem[];
    },
  });
}

export function useUpsertChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<PendencyChecklistItem> & { pendency_id: string; texto: string }) => {
      if (item.id) {
        const { id, ...rest } = item;
        const { error } = await supabase.from("pendency_checklist_items").update(rest).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("pendency_checklist_items").insert(item as any);
        if (error) throw error;
      }
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["pendency_checklist", v.pendency_id] }),
  });
}

export function useDeleteChecklistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; pendency_id: string }) => {
      const { error } = await supabase.from("pendency_checklist_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["pendency_checklist", v.pendency_id] }),
  });
}

// =========== Profiles list (for assign) ===========
export function useProfilesLite() {
  return useQuery({
    queryKey: ["profiles_lite"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, full_name, role")
        .eq("active", true)
        .order("full_name");
      if (error) throw error;
      return (data ?? []) as Array<{ user_id: string; full_name: string; role: string }>;
    },
    staleTime: 60_000,
  });
}
