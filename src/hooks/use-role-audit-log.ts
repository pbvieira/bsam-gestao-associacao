import { useQuery, keepPreviousData } from "@tanstack/react-query";
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

export interface RoleAuditFilters {
  roleId?: string;
  action?: RoleAuditEntry["action"];
  capability?: string;
  dateFrom?: string; // ISO date (yyyy-mm-dd)
  dateTo?: string;
  search?: string;
}

export interface RoleAuditQueryParams extends RoleAuditFilters {
  page?: number; // 1-based
  pageSize?: number;
}

export interface RoleAuditPage {
  rows: RoleAuditEntry[];
  total: number;
  page: number;
  pageSize: number;
}

export function useRoleAuditLog(limit = 200) {
  return useQuery({
    queryKey: ["role-audit-log", "simple", limit],
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

export function useRoleAuditLogPaged(params: RoleAuditQueryParams) {
  const {
    page = 1,
    pageSize = 25,
    roleId,
    action,
    capability,
    dateFrom,
    dateTo,
    search,
  } = params;

  return useQuery({
    queryKey: [
      "role-audit-log",
      "paged",
      { page, pageSize, roleId, action, capability, dateFrom, dateTo, search },
    ],
    queryFn: async (): Promise<RoleAuditPage> => {
      let query = supabase
        .from("role_audit_log")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (roleId) query = query.eq("role_id", roleId);
      if (action) query = query.eq("action", action);
      if (capability) query = query.ilike("capability", `%${capability}%`);
      if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00`);
      if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59`);
      if (search) {
        const s = search.replace(/[,()]/g, " ").trim();
        if (s) {
          query = query.or(
            [
              `role_label.ilike.%${s}%`,
              `role_key.ilike.%${s}%`,
              `actor_name.ilike.%${s}%`,
              `capability.ilike.%${s}%`,
            ].join(",")
          );
        }
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      const { data, error, count } = await query.range(from, to);
      if (error) throw error;
      return {
        rows: (data ?? []) as RoleAuditEntry[],
        total: count ?? 0,
        page,
        pageSize,
      };
    },
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  });
}
