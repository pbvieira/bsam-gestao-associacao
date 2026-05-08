import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useUpsertRole, type Role } from "@/hooks/use-roles";
import { toast } from "sonner";

interface RoleFormDialogProps {
  open: boolean;
  role: Role | null;
  onClose: () => void;
}

const KEY_REGEX = /^[a-z][a-z0-9_]*$/;

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
}

export function RoleFormDialog({ open, role, onClose }: RoleFormDialogProps) {
  const isEdit = !!role;
  const isSystem = !!role?.is_system;
  const upsert = useUpsertRole();

  const [label, setLabel] = useState("");
  const [key, setKey] = useState("");
  const [keyTouched, setKeyTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [ordem, setOrdem] = useState<number>(0);
  const [ativo, setAtivo] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLabel(role?.label ?? "");
    setKey(role?.key ?? "");
    setKeyTouched(!!role);
    setDescription(role?.description ?? "");
    setOrdem(role?.ordem ?? 0);
    setAtivo(role?.ativo ?? true);
  }, [open, role]);

  const handleLabelChange = (val: string) => {
    setLabel(val);
    if (!isEdit && !keyTouched) {
      setKey(slugify(val));
    }
  };

  const handleSubmit = async () => {
    const trimmedLabel = label.trim();
    const trimmedKey = key.trim();
    if (!trimmedLabel) {
      toast.error("Informe o nome da função");
      return;
    }
    if (!isEdit) {
      if (!trimmedKey) {
        toast.error("Informe a chave técnica");
        return;
      }
      if (!KEY_REGEX.test(trimmedKey)) {
        toast.error(
          "Chave deve começar com letra minúscula e conter apenas a-z, 0-9 e _"
        );
        return;
      }
    }
    try {
      await upsert.mutateAsync({
        id: role?.id,
        key: trimmedKey,
        label: trimmedLabel,
        description: description.trim() || null,
        ordem: Number.isFinite(ordem) ? ordem : 0,
        ativo,
      });
      toast.success(isEdit ? "Função atualizada" : "Função criada");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar função";
      if (msg.toLowerCase().includes("duplicate") || msg.includes("23505")) {
        toast.error("Já existe uma função com essa chave");
      } else {
        toast.error(msg);
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? "Editar função" : "Nova função"}
            {isSystem && (
              <Badge variant="secondary" className="text-xs">
                Sistema
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {isSystem
              ? "Funções do sistema só permitem editar nome, descrição e ordem."
              : "Defina nome e chave técnica da função personalizada."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="role-label">Nome *</Label>
            <Input
              id="role-label"
              value={label}
              onChange={(e) => handleLabelChange(e.target.value)}
              placeholder="Ex: Recepcionista"
              maxLength={60}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role-key">Chave técnica *</Label>
            <Input
              id="role-key"
              value={key}
              onChange={(e) => {
                setKey(e.target.value.toLowerCase());
                setKeyTouched(true);
              }}
              placeholder="ex: recepcionista"
              maxLength={40}
              disabled={isEdit}
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              {isEdit
                ? "A chave técnica não pode ser alterada após a criação."
                : "Apenas letras minúsculas, números e _."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role-desc">Descrição</Label>
            <Textarea
              id="role-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Para que serve esta função?"
              rows={3}
              maxLength={250}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="role-ordem">Ordem</Label>
              <Input
                id="role-ordem"
                type="number"
                value={ordem}
                onChange={(e) => setOrdem(parseInt(e.target.value, 10) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="role-ativo">Ativo</Label>
              <div className="flex items-center h-10 gap-2">
                <Switch
                  id="role-ativo"
                  checked={ativo}
                  onCheckedChange={setAtivo}
                />
                <span className="text-sm text-muted-foreground">
                  {ativo ? "Disponível" : "Inativa"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={upsert.isPending}>
            {upsert.isPending
              ? "Salvando..."
              : isEdit
                ? "Salvar"
                : "Criar função"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
