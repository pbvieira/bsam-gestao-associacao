import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Trash2, Check, X, Plus, MoveRight, UserPlus, CheckCircle2, XCircle, Clock, AlertTriangle,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Pendency, PendencyColumn, PendencyPriority,
  useCreatePendency, useUpdatePendency, useDeletePendency, useMovePendency,
  usePendencyComments, useCreateComment,
  usePendencyActivity,
  usePendencyChecklist, useUpsertChecklistItem, useDeleteChecklistItem,
  usePendencyCategories, useProfilesLite,
} from "@/hooks/use-pendencies";
import { useSetores } from "@/hooks/use-setores";
import { useAreas } from "@/hooks/use-areas";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

interface PendencyDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  boardId: string;
  columns: PendencyColumn[];
  pendency?: Pendency | null;
  initialColumnId?: string;
}

export function PendencyDialog({ open, onOpenChange, boardId, columns, pendency, initialColumnId }: PendencyDialogProps) {
  const isEdit = !!pendency;
  const { user } = useAuth();
  const createMut = useCreatePendency();
  const updateMut = useUpdatePendency();
  const deleteMut = useDeletePendency();
  const moveMut = useMovePendency();
  const { data: categories = [] } = usePendencyCategories();
  const { areas = [] } = useAreas();
  const { setores = [] } = useSetores();
  const { data: profiles = [] } = useProfilesLite();

  const [form, setForm] = useState<Partial<Pendency>>({});
  const [tab, setTab] = useState("detalhes");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<PendencyColumn | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    if (open) {
      setTab("detalhes");
      if (pendency) {
        setForm(pendency);
      } else {
        setForm({
          board_id: boardId,
          column_id: initialColumnId || columns[0]?.id,
          titulo: "",
          descricao: "",
          prioridade: "media",
          status_aceite: "pendente",
          solicitante_id: user?.id,
        });
      }
    }
  }, [open, pendency, boardId, columns, initialColumnId, user?.id]);

  const currentColumn = columns.find(c => c.id === form.column_id);

  const handleSave = async () => {
    if (!form.titulo?.trim()) return;
    if (isEdit) {
      // Edição: não permite mover de coluna por aqui (usar trilha de status)
      const { column_id, ...rest } = form;
      await updateMut.mutateAsync({ ...rest, id: pendency!.id } as any);
    } else {
      await createMut.mutateAsync(form as any);
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!pendency) return;
    await deleteMut.mutateAsync(pendency.id);
    setConfirmDelete(false);
    onOpenChange(false);
  };

  const handleStatusClick = (col: PendencyColumn) => {
    if (!pendency || col.id === form.column_id) return;
    if (col.kind === "rejected") {
      setRejectReason("");
      setRejectTarget(col);
      return;
    }
    moveMut.mutate({ id: pendency.id, column_id: col.id, targetKind: col.kind });
    setForm(f => ({ ...f, column_id: col.id }));
  };

  const confirmReject = () => {
    if (!pendency || !rejectTarget || !rejectReason.trim()) return;
    moveMut.mutate(
      { id: pendency.id, column_id: rejectTarget.id, targetKind: "rejected", motivo_rejeicao: rejectReason },
      {
        onSuccess: () => {
          setForm(f => ({ ...f, column_id: rejectTarget.id, motivo_rejeicao: rejectReason, status_aceite: "rejeitada" }));
          setRejectTarget(null);
        },
      }
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Editar Pendência" : "Nova Pendência"}</DialogTitle>
          </DialogHeader>

          <Tabs value={tab} onValueChange={setTab} className="flex-1 overflow-hidden flex flex-col">
            <TabsList>
              <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
              <TabsTrigger value="checklist" disabled={!isEdit}>Checklist</TabsTrigger>
              <TabsTrigger value="comentarios" disabled={!isEdit}>Comentários</TabsTrigger>
              <TabsTrigger value="historico" disabled={!isEdit}>Histórico</TabsTrigger>
            </TabsList>

            <ScrollArea className="mt-2 px-3 h-[calc(90vh-220px)] min-h-[400px]">
              <TabsContent value="detalhes" className="space-y-5 mt-0 h-full pb-4">
                {/* Status atual + trilha de colunas */}
                {isEdit && (
                  <div className="rounded-lg border bg-muted/30 p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Status</Label>
                      {form.data_aceite && (
                        <span className="text-xs text-muted-foreground">
                          Aceite em {format(parseISO(form.data_aceite), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {columns.map(col => {
                        const active = col.id === form.column_id;
                        return (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => handleStatusClick(col)}
                            className={cn(
                              "px-3 py-1.5 rounded-md text-xs font-medium border transition-all",
                              active
                                ? "text-white shadow-sm"
                                : "bg-background hover:bg-accent text-foreground"
                            )}
                            style={active ? { backgroundColor: col.cor || "hsl(var(--primary))", borderColor: col.cor || undefined } : undefined}
                          >
                            {col.nome}
                          </button>
                        );
                      })}
                    </div>
                    {form.data_entrega && (
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Entregue em {format(parseISO(form.data_entrega), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                    )}
                    {form.status_aceite === "rejeitada" && form.motivo_rejeicao && (
                      <div className="text-xs border-l-2 border-destructive pl-2">
                        <span className="font-medium">Motivo da rejeição:</span> {form.motivo_rejeicao}
                      </div>
                    )}
                  </div>
                )}

                {/* Demanda */}
                <section className="space-y-3">
                  <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Demanda</h4>
                  <div className="space-y-2">
                    <Label>Título *</Label>
                    <Input value={form.titulo || ""} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Título resumido" />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Textarea rows={3} value={form.descricao || ""} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Detalhe a demanda..." />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Prioridade</Label>
                      <Select value={form.prioridade} onValueChange={(v: PendencyPriority) => setForm({ ...form, prioridade: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Prazo</Label>
                      <Input type="date" value={form.prazo || ""} onChange={e => setForm({ ...form, prazo: e.target.value || null })} />
                    </div>
                    {!isEdit && (
                      <div className="space-y-2 col-span-2">
                        <Label>Coluna inicial</Label>
                        <Select value={form.column_id} onValueChange={v => setForm({ ...form, column_id: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {columns.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </section>

                {/* Responsabilidades */}
                <section className="space-y-3 border-t pt-4">
                  <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Responsabilidades</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Solicitante</Label>
                      <Select value={form.solicitante_id || ""} onValueChange={v => setForm({ ...form, solicitante_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {profiles.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Responsável pela execução</Label>
                      <Select value={form.responsavel_id || ""} onValueChange={v => setForm({ ...form, responsavel_id: v || null })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {profiles.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Área</Label>
                      <Select value={form.area_id || ""} onValueChange={v => setForm({ ...form, area_id: v || null, setor_id: null })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {areas.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Setor</Label>
                      <Select value={form.setor_id || ""} onValueChange={v => setForm({ ...form, setor_id: v || null })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {setores.filter((s: any) => !form.area_id || s.area_id === form.area_id).map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Categoria</Label>
                      <Select value={form.categoria_id || ""} onValueChange={v => setForm({ ...form, categoria_id: v || null })}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>
                          {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </section>

                {/* Bloqueio externo */}
                <section className="space-y-3 border-t pt-4">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs uppercase tracking-wide text-muted-foreground font-semibold">Bloqueio externo</h4>
                    {(form.dep_setor_id || form.dep_responsavel_id) && (
                      <Badge variant="destructive" className="text-[10px] h-5 gap-1">
                        <AlertTriangle className="h-3 w-3" /> Bloqueada
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Setor bloqueador</Label>
                      <Select value={form.dep_setor_id || ""} onValueChange={v => setForm({ ...form, dep_setor_id: v || null })}>
                        <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                        <SelectContent>
                          {setores.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Responsável pelo bloqueio</Label>
                      <Select value={form.dep_responsavel_id || ""} onValueChange={v => setForm({ ...form, dep_responsavel_id: v || null })}>
                        <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                        <SelectContent>
                          {profiles.map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Textarea
                    placeholder="Motivo do bloqueio"
                    value={form.dep_descricao || ""}
                    onChange={e => setForm({ ...form, dep_descricao: e.target.value })}
                  />
                  {(form.dep_setor_id || form.dep_responsavel_id) && (
                    <p className="text-[11px] text-muted-foreground">
                      Ao salvar, a pendência será movida automaticamente para a coluna "Bloqueada".
                    </p>
                  )}
                </section>
              </TabsContent>

              <TabsContent value="checklist" className="mt-0 h-full pb-4">
                {pendency && <ChecklistTab pendencyId={pendency.id} />}
              </TabsContent>
              <TabsContent value="comentarios" className="mt-0 h-full pb-4">
                {pendency && <CommentsTab pendencyId={pendency.id} profiles={profiles} />}
              </TabsContent>
              <TabsContent value="historico" className="mt-0 h-full pb-4">
                {pendency && <HistoryTab pendencyId={pendency.id} profiles={profiles} />}
              </TabsContent>
            </ScrollArea>
          </Tabs>

          <DialogFooter className="border-t pt-3">
            {isEdit && (
              <Button variant="destructive" size="sm" onClick={() => setConfirmDelete(true)} className="mr-auto">
                <Trash2 className="h-4 w-4 mr-1" /> Excluir
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.titulo?.trim()}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pendência?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Todos os comentários, checklist e histórico associados serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!rejectTarget} onOpenChange={(v) => !v && setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar pendência</AlertDialogTitle>
            <AlertDialogDescription>
              Informe o motivo da rejeição. Esta informação ficará registrada no histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            autoFocus
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Motivo da rejeição..."
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              disabled={!rejectReason.trim()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar rejeição
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ChecklistTab({ pendencyId }: { pendencyId: string }) {
  const { data: items = [] } = usePendencyChecklist(pendencyId);
  const upsert = useUpsertChecklistItem();
  const del = useDeleteChecklistItem();
  const [novo, setNovo] = useState("");
  const done = items.filter(i => i.concluido).length;

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <div className="text-xs text-muted-foreground">{done}/{items.length} concluídos</div>
      )}
      {items.map(i => (
        <div key={i.id} className="flex items-center gap-2">
          <Button
            size="icon" variant={i.concluido ? "default" : "outline"} className="h-6 w-6"
            onClick={() => upsert.mutate({ ...i, concluido: !i.concluido })}
          >
            {i.concluido && <Check className="h-3 w-3" />}
          </Button>
          <span className={i.concluido ? "line-through text-muted-foreground flex-1" : "flex-1"}>{i.texto}</span>
          <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => del.mutate({ id: i.id, pendency_id: pendencyId })}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2">
        <Input value={novo} onChange={e => setNovo(e.target.value)} placeholder="Nova subtarefa" />
        <Button onClick={() => { if (novo.trim()) { upsert.mutate({ pendency_id: pendencyId, texto: novo, posicao: items.length }); setNovo(""); } }}>
          Adicionar
        </Button>
      </div>
    </div>
  );
}

function CommentsTab({ pendencyId, profiles }: { pendencyId: string; profiles: Array<{ user_id: string; full_name: string }> }) {
  const { data: comments = [] } = usePendencyComments(pendencyId);
  const create = useCreateComment();
  const [text, setText] = useState("");
  const nameOf = (id: string | null) => profiles.find(p => p.user_id === id)?.full_name || "Usuário";

  return (
    <div className="space-y-3">
      {comments.map(c => (
        <div key={c.id} className="border rounded p-2">
          <div className="text-xs text-muted-foreground flex justify-between">
            <span className="font-medium">{nameOf(c.autor_id)}</span>
            <span>{format(parseISO(c.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</span>
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap">{c.texto}</p>
        </div>
      ))}
      <div className="flex gap-2">
        <Textarea rows={2} value={text} onChange={e => setText(e.target.value)} placeholder="Escreva um comentário..." />
        <Button onClick={() => { if (text.trim()) { create.mutate({ pendency_id: pendencyId, texto: text }); setText(""); } }}>
          Enviar
        </Button>
      </div>
    </div>
  );
}

function HistoryTab({ pendencyId, profiles }: { pendencyId: string; profiles: Array<{ user_id: string; full_name: string }> }) {
  const { data: items = [] } = usePendencyActivity(pendencyId);
  const nameOf = (id: string | null) => profiles.find(p => p.user_id === id)?.full_name || "Sistema";

  const renderAction = (it: { acao: string; payload: any }) => {
    const p = it.payload || {};
    switch (it.acao) {
      case "created":
        return <><Plus className="h-3.5 w-3.5 text-primary" /> criou a pendência</>;
      case "moved":
        return (
          <>
            <MoveRight className="h-3.5 w-3.5 text-blue-500" />
            moveu de <strong>{p.from_name || "—"}</strong> para <strong>{p.to_name || "—"}</strong>
          </>
        );
      case "assigned":
        return <><UserPlus className="h-3.5 w-3.5 text-purple-500" /> alterou o responsável para <strong>{nameOf(p.responsavel_id)}</strong></>;
      case "aceita":
        return <><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> pendência aceita</>;
      case "rejeitada":
        return <><XCircle className="h-3.5 w-3.5 text-destructive" /> rejeitou{p.motivo ? <> — <em>{p.motivo}</em></> : null}</>;
      case "pendente":
        return <><Clock className="h-3.5 w-3.5 text-muted-foreground" /> voltou para pendente</>;
      case "completed":
        return <><CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> marcou como concluída</>;
      default:
        return <>{it.acao}</>;
    }
  };

  return (
    <div className="space-y-2">
      {items.map(it => (
        <div key={it.id} className="text-sm border-l-2 border-muted pl-3 py-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-medium">{nameOf(it.autor_id)}</span>
            <span className="text-muted-foreground font-normal flex items-center gap-1.5">{renderAction(it)}</span>
          </div>
          <div className="text-xs text-muted-foreground">{format(parseISO(it.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}</div>
        </div>
      ))}
      {items.length === 0 && <div className="text-sm text-muted-foreground">Sem atividade.</div>}
    </div>
  );
}
