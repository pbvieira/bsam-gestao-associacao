import { useState, useEffect } from "react";
import { UserRole } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useRoleAccessByRole, useUpdateRoleAccess } from "@/hooks/use-role-access";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

interface RolePermissionsModalProps {
  role: UserRole | null;
  onClose: () => void;
  modules: Array<{ value: string; label: string }>;
  roles: Array<{ value: UserRole; label: string; color: string }>;
}

export function RolePermissionsModal({ role, onClose, modules, roles }: RolePermissionsModalProps) {
  const { data: permissions = [], isLoading } = useRoleAccessByRole(role);
  const updateRoleAccess = useUpdateRoleAccess();
  const [localChanges, setLocalChanges] = useState<Record<string, boolean>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const currentRole = roles.find(r => r.value === role);

  useEffect(() => {
    setLocalChanges({});
    setHasChanges(false);
  }, [role]);

  const getPermissionState = (module: string): boolean => {
    if (localChanges.hasOwnProperty(module)) {
      return localChanges[module];
    }
    return permissions.some(p => p.module === module && p.allowed);
  };

  const togglePermission = (module: string) => {
    const currentState = getPermissionState(module);
    const newState = !currentState;
    
    setLocalChanges(prev => ({
      ...prev,
      [module]: newState
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!role || Object.keys(localChanges).length === 0) return;

    const updates = Object.entries(localChanges).map(([module, allowed]) => ({
      role,
      module,
      allowed
    }));

    try {
      await updateRoleAccess.mutateAsync(updates);
      setLocalChanges({});
      setHasChanges(false);
      toast.success("Permissões atualizadas com sucesso!");
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast.error("Erro ao salvar as permissões");
    }
  };

  const handleResetChanges = () => {
    setLocalChanges({});
    setHasChanges(false);
  };

  const grantAllPermissions = () => {
    const newChanges: Record<string, boolean> = {};
    modules.forEach(module => {
      if (!getPermissionState(module.value)) {
        newChanges[module.value] = true;
      }
    });
    setLocalChanges(prev => ({ ...prev, ...newChanges }));
    setHasChanges(Object.keys(newChanges).length > 0);
  };

  const revokeAllPermissions = () => {
    const newChanges: Record<string, boolean> = {};
    modules.forEach(module => {
      if (getPermissionState(module.value)) {
        newChanges[module.value] = false;
      }
    });
    setLocalChanges(prev => ({ ...prev, ...newChanges }));
    setHasChanges(Object.keys(newChanges).length > 0);
  };

  const handleClose = () => {
    if (hasChanges) {
      if (confirm("Você tem alterações não salvas. Deseja realmente fechar?")) {
        handleResetChanges();
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!role) return null;

  return (
    <Dialog open={!!role} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Permissões -
            {currentRole && (
              <Badge 
                variant="secondary" 
                className={`${currentRole.color} text-white`}
              >
                {currentRole.label}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={grantAllPermissions}
              className="text-green-600"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Conceder Todas
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={revokeAllPermissions}
              className="text-red-600"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Revogar Todas
            </Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: modules.length }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/2" />
                  <div className="h-6 bg-muted rounded w-11" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {modules.map((module) => {
                const isAllowed = getPermissionState(module.value);
                const hasLocalChange = localChanges.hasOwnProperty(module.value);
                
                return (
                  <div 
                    key={module.value} 
                    className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      hasLocalChange ? 'bg-muted/50 border-primary/50' : 'hover:bg-muted/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{module.label}</span>
                      {hasLocalChange && (
                        <Badge variant="outline" className="text-xs">
                          Modificado
                        </Badge>
                      )}
                    </div>
                    <Switch
                      checked={isAllowed}
                      onCheckedChange={() => togglePermission(module.value)}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSaveChanges}
            disabled={!hasChanges || updateRoleAccess.isPending}
          >
            {updateRoleAccess.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>

        {hasChanges && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800">
              ⚠️ Você tem alterações não salvas. Clique em "Salvar Alterações" para aplicá-las.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}