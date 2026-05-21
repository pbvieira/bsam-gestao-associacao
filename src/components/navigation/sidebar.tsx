import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "react-router-dom";
import { Users, Package, BarChart3, Home, User, ShoppingCart, Warehouse, LogOut, CheckSquare, Calendar, Shield, Pill, Settings, Stethoscope, CalendarCheck, History, ChevronDown, LayoutDashboard, GraduationCap, BarChart2, ShieldCheck } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { usePendingInvitationsCount } from "@/hooks/use-pending-invitations-count";

type NavItem = { name: string; href: string; icon: any; module: string };
type NavGroup = { id: string; label: string; icon: any; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    id: "principal",
    label: "Principal",
    icon: LayoutDashboard,
    items: [
      { name: "Dashboard", href: "/", icon: Home, module: "dashboard" },
      { name: "TAREFAS", href: "/tarefas", icon: CheckSquare, module: "tasks" },
    ],
  },
  {
    id: "calendario",
    label: "Calendário",
    icon: Calendar,
    items: [
      { name: "Calendário", href: "/calendario", icon: Calendar, module: "calendar" },
      { name: "Convites Pendentes", href: "/convites-pendentes", icon: CalendarCheck, module: "calendar" },
      { name: "Histórico de Convites", href: "/convites-historico", icon: History, module: "calendar" },
    ],
  },
  {
    id: "alunos",
    label: "Alunos",
    icon: GraduationCap,
    items: [
      { name: "Alunos", href: "/alunos", icon: Users, module: "students" },
      { name: "Medicamentos", href: "/medicacoes", icon: Pill, module: "students" },
      { name: "Consultas", href: "/consultas", icon: Stethoscope, module: "students" },
    ],
  },
  {
    id: "suprimentos",
    label: "Suprimentos",
    icon: Warehouse,
    items: [
      { name: "Estoque", href: "/estoque", icon: Warehouse, module: "inventory" },
      { name: "Fornecedores", href: "/fornecedores", icon: Package, module: "suppliers" },
      { name: "Compras", href: "/compras", icon: ShoppingCart, module: "purchases" },
    ],
  },
  {
    id: "analise",
    label: "Análise",
    icon: BarChart2,
    items: [
      { name: "Relatórios", href: "/relatorios", icon: BarChart3, module: "reports" },
    ],
  },
  {
    id: "admin",
    label: "Administração",
    icon: ShieldCheck,
    items: [
      { name: "Usuários", href: "/usuarios", icon: User, module: "users" },
      { name: "Gestão de Permissões", href: "/gestao-roles", icon: Shield, module: "users" },
      { name: "Configurações", href: "/configuracoes", icon: Settings, module: "students" },
    ],
  },
];

export function AppSidebar() {
  const { profile, canAccess, signOut } = useAuth();
  const location = useLocation();
  const { open } = useSidebar();
  const pendingInvites = usePendingInvitationsCount();

  const visibleGroups = navGroups
    .map(g => ({ ...g, items: g.items.filter(i => canAccess(i.module)) }))
    .filter(g => g.items.length > 0);

  const STORAGE_KEY = "sidebar:openGroups";

  // Expand groups containing the active route by default; persist user toggles
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    let stored: Record<string, boolean> = {};
    try {
      const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
      if (raw) stored = JSON.parse(raw) ?? {};
    } catch {
      stored = {};
    }
    const initial: Record<string, boolean> = {};
    visibleGroups.forEach(g => {
      if (typeof stored[g.id] === "boolean") {
        initial[g.id] = stored[g.id];
      } else {
        initial[g.id] = g.items.some(i => i.href === location.pathname) || g.id === "principal";
      }
    });
    return initial;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(openGroups));
    } catch {
      // ignore quota / privacy mode errors
    }
  }, [openGroups]);

  const toggleGroup = (id: string) =>
    setOpenGroups(prev => ({ ...prev, [id]: !prev[id] }));

  const handleSignOut = async () => { await signOut(); };

  const getUserInitials = () => {
    if (!profile?.full_name) return 'U';
    return profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  };

  const renderMenuItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.href;
    const showBadge = item.href === '/convites-pendentes' && pendingInvites > 0;
    const menuButton = (
      <SidebarMenuButton asChild className={cn(
        "h-10 text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200",
        isActive && "bg-white/20 text-white shadow-lg backdrop-blur-sm border border-white/20"
      )}>
        <Link to={item.href} className="flex items-center gap-3">
          <Icon className="h-5 w-5 flex-shrink-0" />
          {open && <span className="font-medium flex-1">{item.name}</span>}
          {showBadge && (
            <Badge variant="destructive" className={cn("h-5 min-w-5 px-1.5 text-xs", !open && "absolute -top-1 -right-1")}>
              {pendingInvites}
            </Badge>
          )}
        </Link>
      </SidebarMenuButton>
    );

    if (!open) {
      return (
        <SidebarMenuItem key={item.name}>
          <Tooltip>
            <TooltipTrigger asChild>{menuButton}</TooltipTrigger>
            <TooltipContent side="right" className="font-medium">{item.name}</TooltipContent>
          </Tooltip>
        </SidebarMenuItem>
      );
    }
    return <SidebarMenuItem key={item.name}>{menuButton}</SidebarMenuItem>;
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
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent>
          {visibleGroups.map(group => {
            // When collapsed (icon mode), render items flat without group header
            if (!open) {
              return (
                <SidebarGroup key={group.id}>
                  <SidebarGroupContent>
                    <SidebarMenu>{group.items.map(renderMenuItem)}</SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            }

            const isOpen = openGroups[group.id] ?? false;
            const GroupIcon = group.icon;
            const hasActive = group.items.some(i => i.href === location.pathname);
            const groupBadgeCount = group.items.some(i => i.href === '/convites-pendentes') ? pendingInvites : 0;

            return (
              <Collapsible key={group.id} open={isOpen} onOpenChange={() => toggleGroup(group.id)}>
                <SidebarGroup>
                  <CollapsibleTrigger asChild>
                    <SidebarGroupLabel
                      className={cn(
                        "flex items-center gap-2 cursor-pointer text-white/70 hover:text-white hover:bg-white/5 rounded-md px-2 h-9 transition-colors",
                        hasActive && "text-white"
                      )}
                    >
                      <GroupIcon className="h-4 w-4 flex-shrink-0" />
                      <span className="flex-1 text-xs font-semibold uppercase tracking-wide">{group.label}</span>
                      {groupBadgeCount > 0 && !isOpen && (
                        <Badge variant="destructive" className="h-5 min-w-5 px-1.5 text-xs">
                          {groupBadgeCount}
                        </Badge>
                      )}
                      <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen && "rotate-180")} />
                    </SidebarGroupLabel>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
                    <SidebarGroupContent>
                      <SidebarMenu>{group.items.map(renderMenuItem)}</SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            );
          })}
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
                  <TooltipContent side="right" className="font-medium">Sair</TooltipContent>
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
