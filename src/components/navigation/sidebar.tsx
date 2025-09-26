import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Settings, 
  FileText, 
  Package, 
  BarChart3, 
  Home,
  User,
  ShoppingCart,
  Warehouse,
  BookOpen
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
    current: true,
  },
  {
    name: "Alunos",
    href: "/alunos",
    icon: Users,
    current: false,
  },
  {
    name: "Usuários",
    href: "/usuarios",
    icon: User,
    current: false,
  },
  {
    name: "Estoque",
    href: "/estoque",
    icon: Warehouse,
    current: false,
  },
  {
    name: "Fornecedores",
    href: "/fornecedores",
    icon: Package,
    current: false,
  },
  {
    name: "Compras",
    href: "/compras",
    icon: ShoppingCart,
    current: false,
  },
  {
    name: "Relatórios",
    href: "/relatorios",
    icon: BarChart3,
    current: false,
  },
  {
    name: "Configurações",
    href: "/configuracoes",
    icon: Settings,
    current: false,
  },
];

export function Sidebar({ className }: SidebarProps) {
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
          return (
            <Button
              key={item.name}
              variant={item.current ? "default" : "ghost"}
              className={cn(
                "w-full justify-start gap-3 h-11",
                item.current && "bg-primary text-primary-foreground shadow-primary"
              )}
              asChild
            >
              <a href={item.href}>
                <Icon className="h-5 w-5" />
                {item.name}
              </a>
            </Button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <User className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">Usuário Logado</p>
            <p className="text-xs truncate">Coordenador</p>
          </div>
        </div>
      </div>
    </div>
  );
}