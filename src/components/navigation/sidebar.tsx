import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/hooks/use-permissions";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "react-router-dom";
import { 
  Users, 
  FileText, 
  Package, 
  BarChart3, 
  Home,
  User,
  ShoppingCart,
  Warehouse,
  BookOpen,
  LogOut,
  CheckSquare,
  Calendar
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const navigationItems = [
  { name: "Dashboard", href: "/", icon: Home, module: "dashboard" },
  { name: "Tarefas", href: "/tarefas", icon: CheckSquare, module: "tasks" },
  { name: "Calendário", href: "/calendario", icon: Calendar, module: "calendar" },
  { name: "Alunos", href: "/alunos", icon: Users, module: "students" },
  { name: "Usuários", href: "/usuarios", icon: User, module: "users" },
  { name: "Estoque", href: "/estoque", icon: Warehouse, module: "inventory" },
  { name: "Fornecedores", href: "/fornecedores", icon: Package, module: "suppliers" },
  { name: "Compras", href: "/compras", icon: ShoppingCart, module: "purchases" },
  { name: "Relatórios", href: "/relatorios", icon: BarChart3, module: "reports" },
];

export function Sidebar({ className }: SidebarProps) {
  const { canAccess } = usePermissions();
  const { profile, signOut } = useAuth();
  const location = useLocation();
  
  const navigation = navigationItems.filter(item => canAccess(item.module));

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className={cn("flex flex-col w-64 bg-card border-r border-border", className)}>
      {/* Logo */}
      <div className="flex items-center px-6 py-4 border-b border-border">
        <Logo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Button
              key={item.name}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-11",
                isActive && "bg-primary text-primary-foreground shadow-primary"
              )}
              asChild
            >
              <Link to={item.href}>
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border space-y-2">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <span className="text-xs font-medium">
              {profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{profile?.full_name || 'Usuário'}</p>
            <p className="text-xs truncate capitalize">{profile?.role || 'aluno'}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 h-9"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      </div>
    </div>
  );
}