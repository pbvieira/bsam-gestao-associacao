import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CAPABILITY_GROUPS,
  type CapabilityDefinition,
  type CapabilityGroup,
} from "@/lib/capabilities-catalog";
import {
  useRoleCapabilities,
  useSaveRoleCapabilities,
} from "@/hooks/use-role-capabilities";
import type { Role } from "@/hooks/use-roles";
import {
  ChevronDown,
  ChevronRight,
  Info,
  Search,
  ShieldAlert,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface RoleCapabilitiesModalProps {
  role: Role | null;
  onClose: () => void;
}

export function RoleCapabilitiesModal({ role, onClose }: RoleCapabilitiesModalProps) {
  const { data: current = [], isLoading } = useRoleCapabilities(role?.id);
  const save = useSaveRoleCapabilities();

  const [search, setSearch] = useState("");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const initialState = useMemo(() => {
    const map: Record<string, boolean> = {};
    for (const row of current) map[row.capability] = true;
    return map;
  }, [current]);

  // Reseta estado ao trocar de papel
  useEffect(() => {
    setOverrides({});
    setSearch("");
    // Por padrão abre os grupos que tem alguma capability ativa
    const open: Record<string, boolean> = {};
    for (const g of CAPABILITY_GROUPS) {
      open[g.id] = g.capabilities.some((c) => initialState[c.key]);
    }
    setOpenGroups(open);
  }, [role?.id, initialState]);

  const isOn = (key: string): boolean =>
    overrides[key] ?? initialState[key] ?? false;

  const toggle = (key: string) => {
    const next = !isOn(key);
    setOverrides((prev) => {
      const cp = { ...prev };
      const baseline = initialState[key] ?? false;
      if (next === baseline) {
        delete cp[key];
      } else {
        cp[key] = next;
      }
      return cp;
    });
  };

  const groupBulkSet = (group: CapabilityGroup, value: boolean) => {
    setOverrides((prev) => {
      const cp = { ...prev };
      for (const c of group.capabilities) {
        const baseline = initialState[c.key] ?? false;
        if (value === baseline) delete cp[c.key];
        else cp[c.key] = value;
      }
      return cp;
    });
  };

  const allBulkSet = (value: boolean) => {
    setOverrides((prev) => {
      const cp = { ...prev };
      for (const g of CAPABILITY_GROUPS) {
        for (const c of g.capabilities) {
          const baseline = initialState[c.key] ?? false;
          if (value === baseline) delete cp[c.key];
          else cp[c.key] = value;
        }
      }
      return cp;
    });
  };

  const filteredGroups = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) {
      return CAPABILITY_GROUPS.map((g) => ({
        ...g,
        capabilities: [...g.capabilities].sort((a, b) =>
          a.label.localeCompare(b.label, "pt-BR")
        ),
      }));
    }
    return CAPABILITY_GROUPS.map((g) => ({
      ...g,
      capabilities: g.capabilities
        .filter((c) =>
          [c.key, c.label, c.description].some((s) =>
            s.toLowerCase().includes(q)
          )
        )
        .sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
    })).filter((g) => g.capabilities.length > 0);
  }, [search]);

  const dirtyKeys = Object.keys(overrides);
  const hasChanges = dirtyKeys.length > 0;

  const handleSave = async () => {
    if (!role || !hasChanges) return;
    const enabled = dirtyKeys.filter((k) => overrides[k] === true);
    const disabled = dirtyKeys.filter((k) => overrides[k] === false);
    try {
      await save.mutateAsync({ roleId: role.id, enabled, disabled });
      toast.success("Permissões atualizadas com sucesso");
      setOverrides({});
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("Erro ao salvar permissões");
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      const ok = window.confirm(
        "Existem alterações não salvas. Deseja realmente fechar?"
      );
      if (!ok) return;
    }
    setOverrides({});
    onClose();
  };

  if (!role) return null;

  return (
    <Dialog open={!!role} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2">
            Permissões — {role.label}
            {role.is_system && (
              <Badge variant="secondary" className="text-xs">
                Sistema
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {role.description ||
              "Selecione as capabilities concedidas a este papel."}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-3 border-b flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar permissão..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => allBulkSet(true)}>
              <CheckCircle2 className="h-4 w-4 mr-1.5" /> Conceder todas
            </Button>
            <Button variant="outline" size="sm" onClick={() => allBulkSet(false)}>
              <XCircle className="h-4 w-4 mr-1.5" /> Revogar todas
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0 px-6 py-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma permissão corresponde à busca.
            </p>
          ) : (
            <TooltipProvider delayDuration={250}>
              <div className="space-y-3">
                {filteredGroups.map((group) => {
                  const total = group.capabilities.length;
                  const granted = group.capabilities.filter((c) =>
                    isOn(c.key)
                  ).length;
                  const isOpen = openGroups[group.id] ?? false;
                  return (
                    <Collapsible
                      key={group.id}
                      open={isOpen}
                      onOpenChange={(o) =>
                        setOpenGroups((p) => ({ ...p, [group.id]: o }))
                      }
                      className="border rounded-lg"
                    >
                      <div className="flex items-center gap-2 p-3">
                        <CollapsibleTrigger className="flex items-center gap-2 flex-1 text-left">
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div className="flex-1">
                            <div className="font-medium">{group.label}</div>
                            {group.description && (
                              <div className="text-xs text-muted-foreground">
                                {group.description}
                              </div>
                            )}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {granted}/{total}
                          </Badge>
                        </CollapsibleTrigger>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => groupBulkSet(group, true)}
                            className="h-7 px-2 text-xs"
                          >
                            Tudo
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => groupBulkSet(group, false)}
                            className="h-7 px-2 text-xs"
                          >
                            Nada
                          </Button>
                        </div>
                      </div>
                      <CollapsibleContent>
                        <div className="border-t divide-y">
                          {group.capabilities.map((cap) => (
                            <CapabilityRow
                              key={cap.key}
                              cap={cap}
                              checked={isOn(cap.key)}
                              dirty={overrides[cap.key] !== undefined}
                              onToggle={() => toggle(cap.key)}
                            />
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            </TooltipProvider>
          )}
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t flex sm:justify-between gap-2">
          <div className="text-xs text-muted-foreground self-center">
            {hasChanges
              ? `${dirtyKeys.length} alteração(ões) pendente(s)`
              : "Sem alterações"}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasChanges || save.isPending}
            >
              {save.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CapabilityRow({
  cap,
  checked,
  dirty,
  onToggle,
}: {
  cap: CapabilityDefinition;
  checked: boolean;
  dirty: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 ${
        dirty ? "bg-muted/40" : ""
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{cap.label}</span>
          {cap.sensitive && (
            <Tooltip>
              <TooltipTrigger asChild>
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
              </TooltipTrigger>
              <TooltipContent>Permissão sensível</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">{cap.description}</p>
              <p className="text-[10px] mt-1 text-muted-foreground font-mono">
                {cap.key}
              </p>
            </TooltipContent>
          </Tooltip>
          {dirty && (
            <Badge variant="outline" className="text-[10px] h-4 px-1">
              modificado
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {cap.description}
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={onToggle} />
    </div>
  );
}
