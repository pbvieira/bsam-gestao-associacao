import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface RoleAuditEntry {
  id: string;
  entity: "role" | "role_capability";
  action: "created" | "updated" | "deleted" | "granted" | "revoked";
  role_id: string | null;
  role_label: string | null;
  role_key: string | null;
  capability: string | null;
  before_data: unknown;
  after_data: unknown;
  actor_id: string | null;
  actor_name: string | null;
  created_at: string;
}

export function useRoleAuditLog(limit = 200) {
  return useQuery({
    queryKey: ["role-audit-log", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as RoleAuditEntry[];
    },
    staleTime: 30_000,
  });
}
