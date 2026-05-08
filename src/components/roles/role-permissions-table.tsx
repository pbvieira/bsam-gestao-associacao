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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Settings, Pencil, Plus, Trash2 } from "lucide-react";
import {
  useRoles,
  useUsersCountByRole,
  useDeleteRole,
  type Role,
} from "@/hooks/use-roles";
import { useCapabilityCounts } from "@/hooks/use-role-capabilities";
import { RoleCapabilitiesModal } from "./role-capabilities-modal";
import { RoleFormDialog } from "./role-form-dialog";
import { ALL_CAPABILITIES } from "@/lib/capabilities-catalog";
import { toast } from "sonner";

export function RolePermissionsTable() {
  const { data: roles = [], isLoading } = useRoles();
  const { data: capCounts = {} } = useCapabilityCounts();
  const { data: userCounts = {} } = useUsersCountByRole();
  const deleteRole = useDeleteRole();

  const [selected, setSelected] = useState<Role | null>(null);
  const [editing, setEditing] = useState<Role | null>(null);
  const [creating, setCreating] = useState(false);
  const [toDelete, setToDelete] = useState<Role | null>(null);

  const totalCaps = ALL_CAPABILITIES.length;

  const sortedRoles = useMemo(
    () =>
      [...roles].sort(
        (a, b) => a.ordem - b.ordem || a.label.localeCompare(b.label, "pt-BR")
      ),
    [roles]
  );

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteRole.mutateAsync(toDelete.id);
      toast.success("Função excluída");
      setToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir";
      toast.error(msg);
    }
  };

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
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>Funções e permissões</CardTitle>
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova função
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Função</TableHead>
                <TableHead className="w-[140px]">Tipo</TableHead>
                <TableHead className="w-[160px]">Permissões</TableHead>
                <TableHead className="w-[120px]">Usuários</TableHead>
                <TableHead className="w-[260px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedRoles.map((role) => {
                const granted = capCounts[role.id] ?? 0;
                const users = userCounts[role.id] ?? 0;
                const canDelete = !role.is_system && users === 0;
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
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelected(role)}
                        >
                          <Settings className="h-4 w-4 mr-1" />
                          Permissões
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditing(role)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setToDelete(role)}
                          disabled={!canDelete}
                          title={
                            role.is_system
                              ? "Funções do sistema não podem ser excluídas"
                              : users > 0
                                ? `${users} usuário(s) ativo(s) usam esta função`
                                : "Excluir função"
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

      <RoleFormDialog
        open={creating || !!editing}
        role={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />

      <AlertDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir função?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete && (
                <>
                  Esta ação removerá a função{" "}
                  <strong>{toDelete.label}</strong> e todas as suas permissões
                  associadas. Esta operação não pode ser desfeita.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteRole.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteRole.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
