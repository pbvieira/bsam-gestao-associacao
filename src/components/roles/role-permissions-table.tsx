import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Settings } from "lucide-react";
import { useRoles, useUsersCountByRole, type Role } from "@/hooks/use-roles";
import { useCapabilityCounts } from "@/hooks/use-role-capabilities";
import { RoleCapabilitiesModal } from "./role-capabilities-modal";
import { ALL_CAPABILITIES } from "@/lib/capabilities-catalog";

export function RolePermissionsTable() {
  const { data: roles = [], isLoading } = useRoles();
  const { data: capCounts = {} } = useCapabilityCounts();
  const { data: userCounts = {} } = useUsersCountByRole();
  const [selected, setSelected] = useState<Role | null>(null);

  const totalCaps = ALL_CAPABILITIES.length;

  const sortedRoles = useMemo(
    () =>
      [...roles].sort(
        (a, b) =>
          a.ordem - b.ordem || a.label.localeCompare(b.label, "pt-BR")
      ),
    [roles]
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funções e permissões</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Funções e permissões</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Função</TableHead>
                <TableHead className="w-[140px]">Tipo</TableHead>
                <TableHead className="w-[160px]">Permissões</TableHead>
                <TableHead className="w-[120px]">Usuários</TableHead>
                <TableHead className="w-[140px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRoles.map((role) => {
                const granted = capCounts[role.id] ?? 0;
                const users = userCounts[role.id] ?? 0;
                return (
                  <TableRow key={role.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{role.label}</span>
                        <span className="text-xs text-muted-foreground font-mono">
                          {role.key}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {role.is_system ? (
                        <Badge variant="secondary">Sistema</Badge>
                      ) : (
                        <Badge variant="outline">Personalizada</Badge>
                      )}
                      {!role.ativo && (
                        <Badge variant="destructive" className="ml-2">
                          Inativa
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {granted} de {totalCaps}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {users}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelected(role)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Gerenciar
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RoleCapabilitiesModal
        role={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}
