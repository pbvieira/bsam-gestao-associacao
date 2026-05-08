import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Role {
  id: string;
  key: string;
  label: string;
  description: string | null;
  is_system: boolean;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export function useRoles() {
  return useQuery({
    queryKey: ["roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .order("ordem", { ascending: true })
        .order("label", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Role[];
    },
    staleTime: 60_000,
  });
}

/** Contagem de usuários ativos por role_id */
export function useUsersCountByRole() {
  return useQuery({
    queryKey: ["roles", "user-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("role_id")
        .eq("active", true);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data ?? []) {
        const id = (row as { role_id: string | null }).role_id;
        if (!id) continue;
        map[id] = (map[id] ?? 0) + 1;
      }
      return map;
    },
    staleTime: 60_000,
  });
}

export interface UpsertRoleInput {
  id?: string;
  key: string;
  label: string;
  description?: string | null;
  ativo?: boolean;
  ordem?: number;
}

export function useUpsertRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpsertRoleInput) => {
      if (input.id) {
        const { data, error } = await supabase
          .from("roles")
          .update({
            label: input.label,
            description: input.description ?? null,
            ativo: input.ativo ?? true,
            ordem: input.ordem ?? 0,
          })
          .eq("id", input.id)
          .select()
          .single();
        if (error) throw error;
        return data as Role;
      }
      const { data, error } = await supabase
        .from("roles")
        .insert({
          key: input.key,
          label: input.label,
          description: input.description ?? null,
          ativo: input.ativo ?? true,
          ordem: input.ordem ?? 0,
          is_system: false,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Role;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}

export function useDeleteRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("roles").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles"] });
      qc.invalidateQueries({ queryKey: ["role-capabilities"] });
    },
  });
}
