import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useRoleAuditLog, type RoleAuditEntry } from "@/hooks/use-role-audit-log";
import { capabilityLabel } from "@/lib/capabilities-catalog";
import { History } from "lucide-react";

const ACTION_LABEL: Record<RoleAuditEntry["action"], string> = {
  created: "Função criada",
  updated: "Função editada",
  deleted: "Função excluída",
  granted: "Permissão concedida",
  revoked: "Permissão revogada",
};

const ACTION_VARIANT: Record<
  RoleAuditEntry["action"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  created: "default",
  updated: "secondary",
  deleted: "destructive",
  granted: "default",
  revoked: "destructive",
};

function describeUpdate(entry: RoleAuditEntry): string {
  if (entry.entity !== "role" || entry.action !== "updated") return "";
  const before = (entry.before_data ?? {}) as Record<string, unknown>;
  const after = (entry.after_data ?? {}) as Record<string, unknown>;
  const fields = ["label", "description", "ordem", "ativo"] as const;
  const changes: string[] = [];
  for (const f of fields) {
    if (before[f] !== after[f]) {
      changes.push(`${f}: ${JSON.stringify(before[f])} → ${JSON.stringify(after[f])}`);
    }
  }
  return changes.join(" · ");
}

export function RoleAuditLog() {
  const { data: entries = [], isLoading } = useRoleAuditLog(500);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (actionFilter !== "all" && e.action !== actionFilter) return false;
      if (!q) return true;
      return (
        e.role_label?.toLowerCase().includes(q) ||
        e.role_key?.toLowerCase().includes(q) ||
        e.actor_name?.toLowerCase().includes(q) ||
        e.capability?.toLowerCase().includes(q)
      );
    });
  }, [entries, search, actionFilter]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Trilha de auditoria
        </CardTitle>
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Input
            placeholder="Buscar por função, permissão ou autor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-sm"
          />
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as ações</SelectItem>
              <SelectItem value="created">Função criada</SelectItem>
              <SelectItem value="updated">Função editada</SelectItem>
              <SelectItem value="deleted">Função excluída</SelectItem>
              <SelectItem value="granted">Permissão concedida</SelectItem>
              <SelectItem value="revoked">Permissão revogada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="animate-pulse space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhum registro encontrado.
          </p>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[170px]">Quando</TableHead>
                  <TableHead className="w-[170px]">Ação</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Detalhes</TableHead>
                  <TableHead className="w-[180px]">Autor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(
                        new Date(entry.created_at),
                        "dd/MM/yyyy HH:mm",
                        { locale: ptBR }
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={ACTION_VARIANT[entry.action]}>
                        {ACTION_LABEL[entry.action]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {entry.role_label ?? "—"}
                        </span>
                        {entry.role_key && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {entry.role_key}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.entity === "role_capability" && entry.capability ? (
                        <div className="flex flex-col">
                          <span>{capabilityLabel(entry.capability)}</span>
                          <span className="text-xs text-muted-foreground font-mono">
                            {entry.capability}
                          </span>
                        </div>
                      ) : entry.action === "updated" ? (
                        <span className="text-xs text-muted-foreground">
                          {describeUpdate(entry) || "—"}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {entry.actor_name ?? "Sistema"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
