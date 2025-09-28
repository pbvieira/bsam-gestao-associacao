import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRoleAccess, useUpdateRoleAccess } from "@/hooks/use-role-access";
import { Skeleton } from "@/components/ui/skeleton";
import { Save, RotateCcw } from "lucide-react";
import type { UserRole } from "@/hooks/use-auth";

const ROLES: { role: UserRole; label: string; color: string }[] = [
  { role: 'diretor', label: 'Diretor', color: 'bg-red-500' },
  { role: 'coordenador', label: 'Coordenador', color: 'bg-blue-500' },
  { role: 'auxiliar', label: 'Auxiliar', color: 'bg-green-500' },
  { role: 'aluno', label: 'Aluno', color: 'bg-yellow-500' },
  { role: 'administrador', label: 'Administrador', color: 'bg-purple-500' }
];

const MODULES = [
  { module: 'dashboard', label: 'Dashboard' },
  { module: 'users', label: 'Usuários' },
  { module: 'students', label: 'Alunos' },
  { module: 'tasks', label: 'Tarefas' },
  { module: 'calendar', label: 'Calendário' },
  { module: 'inventory', label: 'Estoque' },
  { module: 'suppliers', label: 'Fornecedores' },
  { module: 'purchases', label: 'Compras' },
  { module: 'reports', label: 'Relatórios' }
];

export function RoleAccessMatrix() {
  const { data: roleAccess, isLoading } = useRoleAccess();
  const updateRoleAccess = useUpdateRoleAccess();
  const [localChanges, setLocalChanges] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Função para obter estado atual de uma permissão
  const getPermissionState = (role: UserRole, module: string): boolean => {
    const key = `${role}-${module}`;
    
    // Se há mudanças locais, usar elas
    if (key in localChanges) {
      return localChanges[key];
    }
    
    // Caso contrário, usar dados do servidor
    const permission = (roleAccess || []).find(p => p.role === role && p.module === module);
    return permission?.allowed || false;
  };

  // Função para alternar permissão
  const togglePermission = (role: UserRole, module: string) => {
    const currentState = getPermissionState(role, module);
    const newState = !currentState;
    const key = `${role}-${module}`;
    
    setLocalChanges(prev => ({
      ...prev,
      [key]: newState
    }));
    setHasChanges(true);
  };

  // Função para salvar alterações
  const handleSaveChanges = () => {
    const updates = Object.entries(localChanges).map(([key, allowed]) => {
      const [role, module] = key.split('-');
      return { role: role as UserRole, module, allowed };
    });

    updateRoleAccess.mutate(updates, {
      onSuccess: () => {
        setLocalChanges({});
        setHasChanges(false);
      }
    });
  };

  // Função para resetar alterações
  const handleResetChanges = () => {
    setLocalChanges({});
    setHasChanges(false);
  };

  // Função para conceder todas as permissões para um role
  const grantAllPermissions = (role: UserRole) => {
    const updates: Record<string, boolean> = {};
    MODULES.forEach(({ module }) => {
      updates[`${role}-${module}`] = true;
    });
    
    setLocalChanges(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  // Função para revogar todas as permissões para um role
  const revokeAllPermissions = (role: UserRole) => {
    const updates: Record<string, boolean> = {};
    MODULES.forEach(({ module }) => {
      updates[`${role}-${module}`] = false;
    });
    
    setLocalChanges(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matriz de Permissões</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Matriz de Permissões por Role</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Configure quais módulos cada tipo de usuário pode acessar
            </p>
          </div>
          
          {hasChanges && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleResetChanges}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Resetar
              </Button>
              <Button 
                onClick={handleSaveChanges}
                disabled={updateRoleAccess.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </Button>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 border-b font-medium">Role</th>
                  {MODULES.map(({ module, label }) => (
                    <th key={module} className="text-center p-3 border-b font-medium min-w-[100px]">
                      {label}
                    </th>
                  ))}
                  <th className="text-center p-3 border-b font-medium">Ações</th>
                </tr>
              </thead>
              
              <tbody>
                {ROLES.map(({ role, label, color }) => (
                  <tr key={role} className="hover:bg-muted/50">
                    <td className="p-3 border-b">
                      <Badge className={`${color} text-white`}>
                        {label}
                      </Badge>
                    </td>
                    
                    {MODULES.map(({ module }) => (
                      <td key={module} className="p-3 border-b text-center">
                        <Switch
                          checked={getPermissionState(role, module)}
                          onCheckedChange={() => togglePermission(role, module)}
                        />
                      </td>
                    ))}
                    
                    <td className="p-3 border-b text-center">
                      <div className="flex gap-1 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => grantAllPermissions(role)}
                          className="text-xs"
                        >
                          Conceder Todas
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => revokeAllPermissions(role)}
                          className="text-xs"
                        >
                          Revogar Todas
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {hasChanges && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-orange-800">
                  Você tem alterações não salvas
                </p>
                <p className="text-sm text-orange-600">
                  {Object.keys(localChanges).length} permissão(ões) foram modificadas
                </p>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleResetChanges}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveChanges} disabled={updateRoleAccess.isPending}>
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}