import { useState } from "react";
import { UserRole } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRoleAccess } from "@/hooks/use-role-access";
import { RolePermissionsModal } from "./role-permissions-modal";
import { Settings } from "lucide-react";

const ROLES = [
  { value: 'diretor' as UserRole, label: 'Diretor', color: 'bg-red-500' },
  { value: 'coordenador' as UserRole, label: 'Coordenador', color: 'bg-blue-500' },
  { value: 'auxiliar' as UserRole, label: 'Auxiliar', color: 'bg-green-500' },
  { value: 'aluno' as UserRole, label: 'Aluno', color: 'bg-gray-500' },
  { value: 'administrador' as UserRole, label: 'Administrador', color: 'bg-purple-500' }
];

const MODULES = [
  { value: 'annotation_categories', label: 'Categorias de Anotações' },
  { value: 'calendar', label: 'Calendário' },
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'inventory', label: 'Inventário' },
  { value: 'purchases', label: 'Compras' },
  { value: 'reports', label: 'Relatórios' },
  { value: 'students', label: 'Alunos' },
  { value: 'suppliers', label: 'Fornecedores' },
  { value: 'tasks', label: 'Tarefas' },
  { value: 'users', label: 'Usuários' }
];

export function RolePermissionsTable() {
  const { data: permissions = [], isLoading } = useRoleAccess();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const getPermissionCount = (role: UserRole) => {
    const rolePermissions = permissions.filter(p => p.role === role && p.allowed);
    return `${rolePermissions.length} de ${MODULES.length}`;
  };

  const getRoleBadgeColor = (role: UserRole) => {
    return ROLES.find(r => r.value === role)?.color || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gestão de Permissões por Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
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
          <CardTitle>Gestão de Permissões por Role</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Role</TableHead>
                <TableHead>Módulos Permitidos</TableHead>
                <TableHead className="w-[150px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROLES.map((role) => (
                <TableRow key={role.value}>
                  <TableCell>
                    <Badge 
                      variant="secondary" 
                      className={`${getRoleBadgeColor(role.value)} text-white`}
                    >
                      {role.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {getPermissionCount(role.value)} módulos
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedRole(role.value)}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Gerenciar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RolePermissionsModal
        role={selectedRole}
        onClose={() => setSelectedRole(null)}
        modules={MODULES}
        roles={ROLES}
      />
    </>
  );
}