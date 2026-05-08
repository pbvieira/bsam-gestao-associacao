import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RoleCapabilityRow {
  role_id: string;
  capability: string;
  allowed: boolean;
}

/** Capabilities permitidas para um papel (apenas allowed=true) */
export function useRoleCapabilities(roleId: string | null | undefined) {
  return useQuery({
    queryKey: ["role-capabilities", roleId],
    queryFn: async () => {
      if (!roleId) return [] as RoleCapabilityRow[];
      const { data, error } = await supabase
        .from("role_capabilities")
        .select("role_id, capability, allowed")
        .eq("role_id", roleId)
        .eq("allowed", true);
      if (error) throw error;
      return (data ?? []) as RoleCapabilityRow[];
    },
    enabled: !!roleId,
    staleTime: 30_000,
  });
}

/** Contagem de capabilities allowed=true por role_id, para a tela de listagem */
export function useCapabilityCounts() {
  return useQuery({
    queryKey: ["role-capabilities", "counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_capabilities")
        .select("role_id, allowed");
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data ?? []) {
        const r = row as { role_id: string; allowed: boolean };
        if (!r.allowed) continue;
        map[r.role_id] = (map[r.role_id] ?? 0) + 1;
      }
      return map;
    },
    staleTime: 30_000,
  });
}

/**
 * Aplica diff de capabilities para um papel.
 *  - keys em `enabled`  => upsert allowed=true
 *  - keys em `disabled` => delete (linha removida representa "não permitido")
 */
export function useSaveRoleCapabilities() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      roleId: string;
      enabled: string[];
      disabled: string[];
    }) => {
      const { roleId, enabled, disabled } = params;

      if (enabled.length > 0) {
        const rows = enabled.map((capability) => ({
          role_id: roleId,
          capability,
          allowed: true,
        }));
        const { error } = await supabase
          .from("role_capabilities")
          .upsert(rows, { onConflict: "role_id,capability" });
        if (error) throw error;
      }

      if (disabled.length > 0) {
        const { error } = await supabase
          .from("role_capabilities")
          .delete()
          .eq("role_id", roleId)
          .in("capability", disabled);
        if (error) throw error;
      }
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ["role-capabilities", vars.roleId] });
      qc.invalidateQueries({ queryKey: ["role-capabilities", "counts"] });
      qc.invalidateQueries({ queryKey: ["role-access"] }); // legacy module-access view
    },
  });
}
