import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Users, FileText, Package, BarChart3, Home, User, ShoppingCart, Warehouse, BookOpen, LogOut, CheckSquare, Calendar, Shield, Tag, ChevronDown, Table2, Wallet, Gift, TrendingUp, TrendingDown, Building2, Briefcase, Pill, Syringe } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const mainNavigationItems = [{
  name: "Dashboard",
  href: "/",
  icon: Home,
  module: "dashboard"
}, {
  name: "Tarefas",
  href: "/tarefas",
  icon: CheckSquare,
  module: "tasks"
}, {
  name: "Calendário",
  href: "/calendario",
  icon: Calendar,
  module: "calendar"
}, {
  name: "Alunos",
  href: "/alunos",
  icon: Users,
  module: "students"
}, {
  name: "Usuários",
  href: "/usuarios",
  icon: User,
  module: "users"
}, {
  name: "Estoque",
  href: "/estoque",
  icon: Warehouse,
  module: "inventory"
}, {
  name: "Fornecedores",
  href: "/fornecedores",
  icon: Package,
  module: "suppliers"
}, {
  name: "Compras",
  href: "/compras",
  icon: ShoppingCart,
  module: "purchases"
}, {
  name: "Relatórios",
  href: "/relatorios",
  icon: BarChart3,
  module: "reports"
}, {
  name: "Gestão de Permissões",
  href: "/gestao-roles",
  icon: Shield,
  module: "users"
}];

const auxiliaryTablesItems = [{
  name: "Categorias de Anotações",
  href: "/categorias-anotacoes",
  icon: Tag,
  module: "students"
}, {
  name: "Categorias de Inventário",
  href: "/categorias-inventario",
  icon: Tag,
  module: "inventory"
}, {
  name: "Estado Filiação",
  href: "/estado-filiacao",
  icon: Users,
  module: "students"
}, {
  name: "Tipos de Renda",
  href: "/tipos-renda",
  icon: Wallet,
  module: "students"
}, {
  name: "Tipos de Benefício",
  href: "/tipos-beneficio",
  icon: Gift,
  module: "students"
}, {
  name: "Categorias de Entrada",
  href: "/categorias-entrada",
  icon: TrendingUp,
  module: "students"
}, {
  name: "Categorias de Saída",
  href: "/categorias-saida",
  icon: TrendingDown,
  module: "students"
}, {
  name: "Áreas e Setores",
  href: "/areas-setores",
  icon: Building2,
  module: "students"
}, {
  name: "Situações Trabalhistas",
  href: "/situacoes-trabalhistas",
  icon: Briefcase,
  module: "students"
}, {
  name: "Tipos de Uso Medicamentos",
  href: "/tipos-uso-medicamentos",
  icon: Pill,
  module: "students"
}, {
  name: "Tipos de Vacinas",
  href: "/tipos-vacinas",
  icon: Syringe,
  module: "students"
}];
export function AppSidebar() {
  const {
    profile,
    canAccess,
    signOut
  } = useAuth();
  const location = useLocation();
  const {
    open
  } = useSidebar();

  // Filter navigation items based on user role access
  const mainNavigation = mainNavigationItems.filter(item => canAccess(item.module));
  const auxiliaryNavigation = auxiliaryTablesItems.filter(item => canAccess(item.module));
  
  // Check if any auxiliary item is active to auto-expand
  const isAuxiliaryItemActive = auxiliaryNavigation.some(item => location.pathname === item.href);
  const [auxiliaryTablesOpen, setAuxiliaryTablesOpen] = useState(isAuxiliaryItemActive);

  // Auto-expand when navigating to an auxiliary item
  useEffect(() => {
    if (isAuxiliaryItemActive && !auxiliaryTablesOpen) {
      setAuxiliaryTablesOpen(true);
    }
  }, [isAuxiliaryItemActive]);

  // Debug log para diagnóstico
  console.log('🔍 Sidebar Debug:', {
    userRole: profile?.role,
    mainItems: mainNavigation.length,
    auxiliaryItems: auxiliaryNavigation.length
  });

  const handleSignOut = async () => {
    await signOut();
  };

  const getUserInitials = () => {
    if (!profile?.full_name) return 'U';
    return profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const renderMenuItem = (item: typeof mainNavigationItems[0]) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href;
    const menuButton = (
      <SidebarMenuButton asChild className={cn(
        "h-11 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200",
        isActive && "bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/20"
      )}>
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
  };

  return (
    <TooltipProvider>
      <Sidebar collapsible="icon" className="border-r-0" style={{
        background: 'var(--sidebar-gradient)'
      }}>
        <SidebarHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur-sm">
              <div className="h-5 w-5 bg-white rounded" />
            </div>
            {open && (
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-white">O BOM SAMARITANO</span>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavigation.map(renderMenuItem)}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Tabelas Auxiliares - Collapsible Section */}
          {auxiliaryNavigation.length > 0 && (
            <SidebarGroup>
              <SidebarGroupContent>
                <Collapsible open={auxiliaryTablesOpen} onOpenChange={setAuxiliaryTablesOpen}>
                  {!open ? (
                    // Collapsed sidebar: show tooltip with section name
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton className="h-11 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 w-full">
                            <Table2 className="h-5 w-5 flex-shrink-0" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        Tabelas Auxiliares
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    // Expanded sidebar: show full trigger with chevron
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton className="h-11 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 w-full justify-between">
                        <div className="flex items-center gap-3">
                          <Table2 className="h-5 w-5 flex-shrink-0" />
                          <span className="font-medium">Tabelas Auxiliares</span>
                        </div>
                        <ChevronDown className={cn(
                          "h-4 w-4 transition-transform duration-200",
                          auxiliaryTablesOpen && "rotate-180"
                        )} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                  )}
                  
                  <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                    <SidebarMenu className={cn(open && "pl-4 border-l border-white/10 ml-4 mt-1")}>
                      {auxiliaryNavigation.map(renderMenuItem)}
                    </SidebarMenu>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
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
                {open && <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm truncate">
                      {profile?.full_name || 'Usuário'}
                    </p>
                    <p className="text-xs text-white/70 truncate capitalize">
                      {profile?.role || 'aluno'}
                    </p>
                  </div>}
              </div>
            </SidebarMenuItem>
            
            <SidebarMenuItem>
              {!open ? <Tooltip>
                  <TooltipTrigger asChild>
                    <SidebarMenuButton onClick={handleSignOut} className="h-9 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200">
                      <LogOut className="h-4 w-4" />
                    </SidebarMenuButton>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-medium">
                    Sair
                  </TooltipContent>
                </Tooltip> : <SidebarMenuButton onClick={handleSignOut} className="h-9 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200 justify-start gap-3">
                  <LogOut className="h-4 w-4" />
                  <span>Sair</span>
                </SidebarMenuButton>}
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}
