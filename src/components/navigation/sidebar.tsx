import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "react-router-dom";
import { Users, FileText, Package, BarChart3, Home, User, ShoppingCart, Warehouse, BookOpen, LogOut, CheckSquare, Calendar, Shield, Tag } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const navigationItems = [
  {
    name: "Dashboard",
    href: "/",
    icon: Home,
    module: "dashboard"
  },
  {
    name: "Tarefas",
    href: "/tarefas",
    icon: CheckSquare,
    module: "tasks"
  },
  {
    name: "Calendário",
    href: "/calendario",
    icon: Calendar,
    module: "calendar"
  },
  {
    name: "Alunos",
    href: "/alunos",
    icon: Users,
    module: "students"
  },
  {
    name: "Categorias de Anotações",
    href: "/categorias-anotacoes",
    icon: Tag,
    module: "students"
  },
  {
    name: "Usuários",
    href: "/usuarios",
    icon: User,
    module: "users"
  },
  {
    name: "Estoque",
    href: "/estoque",
    icon: Warehouse,
    module: "inventory"
  },
  {
    name: "Fornecedores",
    href: "/fornecedores",
    icon: Package,
    module: "suppliers"
  },
  {
    name: "Compras",
    href: "/compras",
    icon: ShoppingCart,
    module: "purchases"
  },
  {
    name: "Relatórios",
    href: "/relatorios",
    icon: BarChart3,
    module: "reports"
  },
  {
    name: "Gestão de Permissões",
    href: "/gestao-roles",
    icon: Shield,
    module: "users"
  }
];

export function AppSidebar() {
  const { profile, canAccess, signOut } = useAuth();
  const location = useLocation();
  const { open } = useSidebar();

  // Filter navigation items based on user role access
  const navigation = navigationItems.filter(item => canAccess(item.module));
  
  // Debug log para diagnóstico
  console.log('🔍 Sidebar Debug:', {
    userRole: profile?.role,
    totalItems: navigationItems.length,
    accessibleItems: navigation.length,
    filteredOut: navigationItems.filter(item => !canAccess(item.module)).map(i => i.module),
    availableModules: navigation.map(i => i.module)
  });

  const handleSignOut = async () => {
    await signOut();
  };

  const getUserInitials = () => {
    if (!profile?.full_name) return 'U';
    return profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  return (
    <TooltipProvider>
      <Sidebar collapsible="icon" className="border-r-0" style={{ background: 'var(--sidebar-gradient)' }}>
        <SidebarHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <div className="h-5 w-5 bg-white rounded" />
            </div>
            {open && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">O BOM SAMARITANO</span>
                <span className="text-xs text-white/70">Sistema de Gestão</span>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map(item => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.href;
                  const menuButton = (
                    <SidebarMenuButton 
                      asChild 
                      className={cn(
                        "h-11 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200",
                        isActive && "bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/20"
                      )}
                    >
                      <Link to={item.href} className="flex items-center gap-3">
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {open && <span className="font-medium">{item.name}</span>}
                      </Link>
                    </SidebarMenuButton>
                  );

                  if (!open) {
                    return (
                      <SidebarMenuItem key={item.name}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {menuButton}
                          </TooltipTrigger>
                          <TooltipContent side="right" className="font-medium">
                            {item.name}
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    );
                  }

                  return (
                    <SidebarMenuItem key={item.name}>
                      {menuButton}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-white/10 pt-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <div className="flex items-center gap-3 px-2 py-2">
                <Avatar className="h-8 w-8 bg-white/20 border border-white/30">
                  <AvatarFallback className="bg-transparent text-white text-xs font-bold">
                    {getUserInitials()}
                  </AvatarFallback>
                </Avatar>
                {open && (
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">
                      {profile?.full_name || 'Usuário'}
                    </p>
                    <p className="text-xs text-white/70 truncate capitalize">
                      {profile?.role || 'aluno'}
                    </p>
                  </div>
                )}
              </div>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              {!open ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton 
                      onClick={handleSignOut} 
                      className="h-9 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
                    >
                      <LogOut className="h-4 w-4" />
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    Sair
                  </TooltipContent>
                </Tooltip>
              ) : (
                <SidebarMenuButton 
                  onClick={handleSignOut} 
                  className="h-9 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 justify-start gap-3"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}