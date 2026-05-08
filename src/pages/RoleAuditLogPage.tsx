import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { UnifiedRoute } from "@/components/auth/unified-route";
import { PageLayout } from "@/components/layout/page-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  useRoleAuditLogPaged,
  type RoleAuditEntry,
} from "@/hooks/use-role-audit-log";
import { useRoles } from "@/hooks/use-roles";
import {
  ALL_CAPABILITIES,
  capabilityLabel,
} from "@/lib/capabilities-catalog";
import { ChevronLeft, ChevronRight, Eraser } from "lucide-react";

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
      changes.push(
        `${f}: ${JSON.stringify(before[f])} → ${JSON.stringify(after[f])}`
      );
    }
  }
  return changes.join(" · ");
}

const PAGE_SIZE = 25;

export default function RoleAuditLogPage() {
  const { data: roles = [] } = useRoles();
  const [page, setPage] = useState(1);
  const [roleId, setRoleId] = useState<string>("all");
  const [action, setAction] = useState<string>("all");
  const [capability, setCapability] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [search, setSearch] = useState<string>("");

  const filters = useMemo(
    () => ({
      page,
      pageSize: PAGE_SIZE,
      roleId: roleId !== "all" ? roleId : undefined,
      action: action !== "all" ? (action as RoleAuditEntry["action"]) : undefined,
      capability: capability !== "all" ? capability : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      search: search.trim() || undefined,
    }),
    [page, roleId, action, capability, dateFrom, dateTo, search]
  );

  const { data, isLoading, isFetching } = useRoleAuditLogPaged(filters);
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const resetPage = () => setPage(1);
  const clearFilters = () => {
    setRoleId("all");
    setAction("all");
    setCapability("all");
    setDateFrom("");
    setDateTo("");
    setSearch("");
    setPage(1);
  };

  return (
    <UnifiedRoute module="users" action="read">
      <MainLayout>
        <PageLayout
          title="Trilha de auditoria"
          subtitle="Histórico completo de criação, edição e exclusão de funções e permissões"
        >
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                <div className="space-y-1.5 lg:col-span-2">
                  <Label className="text-xs">Buscar</Label>
                  <Input
                    placeholder="Função, autor, permissão..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      resetPage();
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Função</Label>
                  <Select
                    value={roleId}
                    onValueChange={(v) => {
                      setRoleId(v);
                      resetPage();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Ação</Label>
                  <Select
                    value={action}
                    onValueChange={(v) => {
                      setAction(v);
                      resetPage();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="created">Função criada</SelectItem>
                      <SelectItem value="updated">Função editada</SelectItem>
                      <SelectItem value="deleted">Função excluída</SelectItem>
                      <SelectItem value="granted">
                        Permissão concedida
                      </SelectItem>
                      <SelectItem value="revoked">
                        Permissão revogada
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Permissão</Label>
                  <Select
                    value={capability}
                    onValueChange={(v) => {
                      setCapability(v);
                      resetPage();
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      <SelectItem value="all">Todas</SelectItem>
                      {ALL_CAPABILITIES.map((c) => (
                        <SelectItem key={c.key} value={c.key}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">De</Label>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      resetPage();
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Até</Label>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      resetPage();
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {isLoading
                    ? "Carregando..."
                    : `${total} registro(s) encontrado(s)`}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="gap-2"
                >
                  <Eraser className="h-4 w-4" />
                  Limpar filtros
                </Button>
              </div>

              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-10 bg-muted rounded" />
                  ))}
                </div>
              ) : rows.length === 0 ? (
                <p className="text-sm text-muted-foreground py-10 text-center">
                  Nenhum registro encontrado para os filtros aplicados.
                </p>
              ) : (
                <div
                  className={`rounded-md border overflow-x-auto ${
                    isFetching ? "opacity-70" : ""
                  }`}
                >
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
                      {rows.map((entry) => (
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
                            {entry.entity === "role_capability" &&
                            entry.capability ? (
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

              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  Página {page} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1 || isFetching}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page >= totalPages || isFetching}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </PageLayout>
      </MainLayout>
    </UnifiedRoute>
  );
}
