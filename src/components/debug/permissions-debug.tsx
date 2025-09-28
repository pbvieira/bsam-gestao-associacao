import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDebugPermissions } from "@/hooks/use-debug-permissions";
import { useAuth } from "@/hooks/use-auth";
import { Bug, RefreshCw, TestTube } from "lucide-react";

/**
 * Componente de debug para permissões
 * Deve ser usado apenas em desenvolvimento
 */
export function PermissionsDebug() {
  const { profile, permissions } = useAuth();
  const { runDiagnostics, testModuleAccess, forceReload, authStatus, quickTest } = useDebugPermissions();

  if (!profile) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Bug className="w-4 h-4" />
            Debug: No Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Usuário não carregado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Bug className="w-4 h-4" />
          Debug Permissões
        </CardTitle>
        <CardDescription className="text-xs">
          Role: <Badge variant="outline">{profile.role}</Badge>
          <br />
          Permissões: {permissions.length}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-2">
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs h-7 px-2"
            onClick={runDiagnostics}
          >
            <TestTube className="w-3 h-3 mr-1" />
            Diagnóstico
          </Button>
          
          <Button 
            size="sm" 
            variant="outline" 
            className="text-xs h-7 px-2"
            onClick={forceReload}
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Reload
          </Button>
        </div>
        
        <div className="text-xs space-y-1">
          <div className="font-medium">Status:</div>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Auth:</span>
              <Badge variant={authStatus.authenticated ? "default" : "destructive"} className="text-xs px-1 py-0">
                {authStatus.authenticated ? "✓" : "✗"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Profile:</span>
              <Badge variant={authStatus.hasProfile ? "default" : "destructive"} className="text-xs px-1 py-0">
                {authStatus.hasProfile ? "✓" : "✗"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Permissions:</span>
              <Badge variant={authStatus.hasPermissions ? "default" : "destructive"} className="text-xs px-1 py-0">
                {authStatus.hasPermissions ? "✓" : "✗"}
              </Badge>
            </div>
          </div>
        </div>

        <Button 
          size="sm" 
          variant="secondary" 
          className="text-xs h-7 px-2 w-full"
          onClick={quickTest}
        >
          Teste Rápido
        </Button>
        
        <div className="text-xs text-muted-foreground">
          Veja o console para logs detalhados
        </div>
      </CardContent>
    </Card>
  );
}