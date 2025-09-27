import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/hooks/use-auth';
import { useErrorHandler } from '@/hooks/use-error-handler';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface Permission {
  id: string;
  role: string;
  module: string;
  action: string;
  allowed: boolean;
  created_at: string;
}

interface UserPermissionsDialogProps {
  user: UserProfile;
  onClose: () => void;
}

interface ModulePermission {
  module: string;
  actions: {
    action: string;
    label: string;
    allowed: boolean;
  }[];
}

const MODULES = [
  {
    module: 'dashboard',
    label: 'Dashboard',
    actions: [
      { action: 'read', label: 'Visualizar' },
    ],
  },
  {
    module: 'students',
    label: 'Alunos',
    actions: [
      { action: 'read', label: 'Visualizar' },
      { action: 'create', label: 'Criar' },
      { action: 'update', label: 'Editar' },
      { action: 'delete', label: 'Excluir' },
    ],
  },
  {
    module: 'users',
    label: 'Usuários',
    actions: [
      { action: 'read', label: 'Visualizar' },
      { action: 'create', label: 'Criar' },
      { action: 'update', label: 'Editar' },
      { action: 'delete', label: 'Excluir' },
    ],
  },
  {
    module: 'inventory',
    label: 'Estoque',
    actions: [
      { action: 'read', label: 'Visualizar' },
      { action: 'create', label: 'Criar' },
      { action: 'update', label: 'Editar' },
      { action: 'delete', label: 'Excluir' },
    ],
  },
  {
    module: 'reports',
    label: 'Relatórios',
    actions: [
      { action: 'read', label: 'Visualizar' },
      { action: 'export', label: 'Exportar' },
    ],
  },
];

export function UserPermissionsDialog({ user, onClose }: UserPermissionsDialogProps) {
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const { handleError, handleSuccess } = useErrorHandler();
  const queryClient = useQueryClient();

  const { data: currentPermissions, isLoading } = useQuery({
    queryKey: ['user-permissions', user.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('role', user.role)
        .eq('allowed', true);

      if (error) throw error;
      return data as Permission[];
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async ({ module, action, allowed }: { module: string; action: string; allowed: boolean }) => {
      if (allowed) {
        // Insert permission
        const { error } = await supabase
          .from('permissions')
          .upsert({
            role: user.role,
            module,
            action,
            allowed: true,
          });
        if (error) throw error;
      } else {
        // Delete permission
        const { error } = await supabase
          .from('permissions')
          .delete()
          .eq('role', user.role)
          .eq('module', module)
          .eq('action', action);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', user.id] });
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      handleSuccess('Permissões atualizadas com sucesso!');
    },
    onError: (error) => {
      handleError(error, 'database');
    },
  });

  useEffect(() => {
    if (currentPermissions) {
      const modulePermissions = MODULES.map(module => ({
        module: module.module,
        actions: module.actions.map(action => ({
          ...action,
          allowed: currentPermissions.some(
            p => p.module === module.module && p.action === action.action && p.allowed
          ),
        })),
      }));
      setPermissions(modulePermissions);
    }
  }, [currentPermissions]);

  const handlePermissionChange = (module: string, action: string, allowed: boolean) => {
    setPermissions(prev => prev.map(modulePermission => {
      if (modulePermission.module === module) {
        return {
          ...modulePermission,
          actions: modulePermission.actions.map(actionPermission => {
            if (actionPermission.action === action) {
              return { ...actionPermission, allowed };
            }
            return actionPermission;
          }),
        };
      }
      return modulePermission;
    }));

    updatePermissionMutation.mutate({ module, action, allowed });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'administrador':
        return 'Administrador';
      case 'diretor':
        return 'Diretor';
      case 'coordenador':
        return 'Coordenador';
      case 'auxiliar':
        return 'Auxiliar';
      case 'aluno':
        return 'Aluno';
      default:
        return role;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'administrador':
        return 'destructive';
      case 'diretor':
        return 'default';
      case 'coordenador':
        return 'secondary';
      case 'auxiliar':
        return 'outline';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Dialog open onOpenChange={() => onClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </DialogHeader>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Permissões do Usuário</DialogTitle>
          <DialogDescription>
            Gerencie as permissões de <strong>{user.full_name}</strong> - {' '}
            <Badge variant={getRoleBadgeVariant(user.role) as any}>
              {getRoleLabel(user.role)}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {permissions.map((modulePermission) => {
            const moduleConfig = MODULES.find(m => m.module === modulePermission.module);
            return (
              <Card key={modulePermission.module}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    {moduleConfig?.label || modulePermission.module}
                  </CardTitle>
                  <CardDescription>
                    Permissões para o módulo de {moduleConfig?.label?.toLowerCase() || modulePermission.module}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {modulePermission.actions.map((action) => (
                      <div 
                        key={action.action}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-medium">{action.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {action.action}
                          </p>
                        </div>
                        <Switch
                          checked={action.allowed}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(
                              modulePermission.module, 
                              action.action, 
                              checked
                            )
                          }
                          disabled={updatePermissionMutation.isPending}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}