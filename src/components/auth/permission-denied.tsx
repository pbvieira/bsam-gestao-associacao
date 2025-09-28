import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigationFallback } from "@/hooks/use-navigation-fallback";
import { MainLayout } from "@/components/layout/main-layout";

export function PermissionDenied() {
  const { getAccessibleRoutes, getDefaultRoute } = useNavigationFallback();
  const accessibleRoutes = getAccessibleRoutes();

  return (
    <MainLayout>
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta funcionalidade.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {accessibleRoutes.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Mas você pode acessar estas páginas:
                </p>
                <div className="space-y-2">
                  {accessibleRoutes.slice(0, 5).map((route) => (
                    <Button
                      key={route.path}
                      variant="outline"
                      className="w-full justify-between"
                      asChild
                    >
                      <Link to={route.path}>
                        {route.name}
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ))}
                </div>
                <Button className="w-full" asChild>
                  <Link to={getDefaultRoute()}>
                    Ir para página principal
                  </Link>
                </Button>
              </>
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Você não tem acesso a nenhuma funcionalidade do sistema. 
                  Entre em contato com o administrador.
                </p>
                <Button variant="outline" asChild>
                  <Link to="/auth">Fazer login novamente</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}