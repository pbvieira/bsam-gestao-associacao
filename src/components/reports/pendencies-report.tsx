import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Download, Filter } from 'lucide-react';
import { format, differenceInCalendarDays, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Row {
  id: string;
  titulo: string;
  board_id: string;
  column_id: string;
  prioridade: string;
  status_aceite: string;
  prazo: string | null;
  data_entrega: string | null;
  created_at: string;
  data_aceite: string | null;
  responsavel_id: string | null;
  solicitante_id: string | null;
  setor_id: string | null;
  area_id: string | null;
}

const priorityColors: Record<string, string> = {
  baixa: 'bg-slate-100 text-slate-700',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700',
  urgente: 'bg-red-100 text-red-700',
};

export function PendenciesReport() {
  const [responsavelFilter, setResponsavelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all'); // open|done|overdue|all
  const [setorFilter, setSetorFilter] = useState<string>('all');
  const [boardFilter, setBoardFilter] = useState<string>('all');
  const [acceptanceFilter, setAcceptanceFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const { data: pendencies, isLoading } = useQuery({
    queryKey: ['report_pendencies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pendencies')
        .select('id,titulo,board_id,column_id,prioridade,status_aceite,prazo,data_entrega,created_at,data_aceite,responsavel_id,solicitante_id,setor_id,area_id')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const { data: columns } = useQuery({
    queryKey: ['report_pendency_columns'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pendency_columns').select('id,board_id,nome,kind');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: boards } = useQuery({
    queryKey: ['report_pendency_boards'],
    queryFn: async () => {
      const { data, error } = await supabase.from('pendency_boards').select('id,nome');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: profiles } = useQuery({
    queryKey: ['report_profiles_lite'],
    queryFn: async () => {
      const { data, error } = await supabase.from('profiles').select('user_id,full_name').order('full_name');
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: setores } = useQuery({
    queryKey: ['report_setores'],
    queryFn: async () => {
      const { data, error } = await supabase.from('setores').select('id,nome').order('nome');
      if (error) throw error;
      return data ?? [];
    },
  });

  const colMap = useMemo(() => Object.fromEntries((columns ?? []).map(c => [c.id, c])), [columns]);
  const profileMap = useMemo(() => Object.fromEntries((profiles ?? []).map(p => [p.user_id, p.full_name])), [profiles]);
  const setorMap = useMemo(() => Object.fromEntries((setores ?? []).map(s => [s.id, s.nome])), [setores]);
  const boardMap = useMemo(() => Object.fromEntries((boards ?? []).map(b => [b.id, b.nome])), [boards]);

  const enriched = useMemo(() => {
    const today = new Date();
    return (pendencies ?? []).map(p => {
      const col = colMap[p.column_id];
      const kind = col?.kind ?? 'open';
      const isDone = kind === 'done';
      const isRejected = kind === 'rejected';
      const overdue = !isDone && !isRejected && p.prazo && parseISO(p.prazo) < today;
      const cycleDays = p.data_entrega
        ? differenceInCalendarDays(parseISO(p.data_entrega), parseISO(p.created_at))
        : null;
      const acceptDays = p.data_aceite
        ? differenceInCalendarDays(parseISO(p.data_aceite), parseISO(p.created_at))
        : null;
      return { ...p, kind, isDone, isRejected, overdue, cycleDays, acceptDays, columnName: col?.nome ?? '—' };
    });
  }, [pendencies, colMap]);

  const filtered = useMemo(() => {
    return enriched.filter(p => {
      if (responsavelFilter !== 'all' && p.responsavel_id !== responsavelFilter) return false;
      if (setorFilter !== 'all' && p.setor_id !== setorFilter) return false;
      if (boardFilter !== 'all' && p.board_id !== boardFilter) return false;
      if (acceptanceFilter !== 'all' && p.status_aceite !== acceptanceFilter) return false;
      if (statusFilter === 'open' && (p.isDone || p.isRejected)) return false;
      if (statusFilter === 'done' && !p.isDone) return false;
      if (statusFilter === 'overdue' && !p.overdue) return false;
      if (statusFilter === 'rejected' && !p.isRejected) return false;
      if (dateFrom && parseISO(p.created_at) < parseISO(dateFrom)) return false;
      if (dateTo && parseISO(p.created_at) > parseISO(dateTo + 'T23:59:59')) return false;
      if (search && !p.titulo.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [enriched, responsavelFilter, setorFilter, boardFilter, acceptanceFilter, statusFilter, dateFrom, dateTo, search]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const done = filtered.filter(p => p.isDone).length;
    const open = filtered.filter(p => !p.isDone && !p.isRejected).length;
    const overdue = filtered.filter(p => p.overdue).length;
    const rejected = filtered.filter(p => p.isRejected).length;
    const cycles = filtered.filter(p => p.cycleDays != null).map(p => p.cycleDays as number);
    const avgCycle = cycles.length ? (cycles.reduce((a, b) => a + b, 0) / cycles.length).toFixed(1) : '—';
    const accepts = filtered.filter(p => p.acceptDays != null).map(p => p.acceptDays as number);
    const avgAccept = accepts.length ? (accepts.reduce((a, b) => a + b, 0) / accepts.length).toFixed(1) : '—';
    return { total, done, open, overdue, rejected, avgCycle, avgAccept };
  }, [filtered]);

  const byResponsavel = useMemo(() => {
    const map = new Map<string, { total: number; done: number; overdue: number; open: number }>();
    filtered.forEach(p => {
      const key = p.responsavel_id ?? 'sem';
      const cur = map.get(key) ?? { total: 0, done: 0, overdue: 0, open: 0 };
      cur.total += 1;
      if (p.isDone) cur.done += 1;
      if (p.overdue) cur.overdue += 1;
      if (!p.isDone && !p.isRejected) cur.open += 1;
      map.set(key, cur);
    });
    return Array.from(map.entries())
      .map(([k, v]) => ({ id: k, nome: k === 'sem' ? 'Sem responsável' : (profileMap[k] ?? '—'), ...v }))
      .sort((a, b) => b.total - a.total);
  }, [filtered, profileMap]);

  const bySetor = useMemo(() => {
    const map = new Map<string, { total: number; done: number; overdue: number }>();
    filtered.forEach(p => {
      const key = p.setor_id ?? 'sem';
      const cur = map.get(key) ?? { total: 0, done: 0, overdue: 0 };
      cur.total += 1;
      if (p.isDone) cur.done += 1;
      if (p.overdue) cur.overdue += 1;
      map.set(key, cur);
    });
    return Array.from(map.entries())
      .map(([k, v]) => ({ id: k, nome: k === 'sem' ? 'Sem setor' : (setorMap[k] ?? '—'), ...v }))
      .sort((a, b) => b.total - a.total);
  }, [filtered, setorMap]);

  const exportCsv = () => {
    const header = ['Título', 'Quadro', 'Coluna', 'Prioridade', 'Aceite', 'Solicitante', 'Responsável', 'Setor', 'Criada', 'Prazo', 'Entrega', 'Ciclo (dias)', 'Aceite (dias)', 'Atrasada'];
    const rows = filtered.map(p => [
      p.titulo,
      boardMap[p.board_id] ?? '',
      p.columnName,
      p.prioridade,
      p.status_aceite,
      profileMap[p.solicitante_id ?? ''] ?? '',
      profileMap[p.responsavel_id ?? ''] ?? '',
      setorMap[p.setor_id ?? ''] ?? '',
      format(parseISO(p.created_at), 'dd/MM/yyyy'),
      p.prazo ? format(parseISO(p.prazo), 'dd/MM/yyyy') : '',
      p.data_entrega ? format(parseISO(p.data_entrega), 'dd/MM/yyyy') : '',
      p.cycleDays ?? '',
      p.acceptDays ?? '',
      p.overdue ? 'Sim' : 'Não',
    ]);
    const csv = [header, ...rows]
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pendencias_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="h-4 w-4" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Input placeholder="Buscar título..." value={search} onChange={e => setSearch(e.target.value)} />
            <Select value={boardFilter} onValueChange={setBoardFilter}>
              <SelectTrigger><SelectValue placeholder="Quadro" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os quadros</SelectItem>
                {(boards ?? []).map(b => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
              <SelectTrigger><SelectValue placeholder="Responsável" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os responsáveis</SelectItem>
                {(profiles ?? []).map(p => <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={setorFilter} onValueChange={setSetorFilter}>
              <SelectTrigger><SelectValue placeholder="Setor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os setores</SelectItem>
                {(setores ?? []).map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="open">Em aberto</SelectItem>
                <SelectItem value="done">Concluídas</SelectItem>
                <SelectItem value="overdue">Atrasadas</SelectItem>
                <SelectItem value="rejected">Rejeitadas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={acceptanceFilter} onValueChange={setAcceptanceFilter}>
              <SelectTrigger><SelectValue placeholder="Aceite" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os aceites</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="aceita">Aceita</SelectItem>
                <SelectItem value="rejeitada">Rejeitada</SelectItem>
              </SelectContent>
            </Select>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} placeholder="De" />
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} placeholder="Até" />
          </div>
          <div className="mt-3 flex justify-end">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="mr-2 h-4 w-4" /> Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-7">
        {[
          { label: 'Total', value: stats.total },
          { label: 'Em aberto', value: stats.open },
          { label: 'Concluídas', value: stats.done },
          { label: 'Atrasadas', value: stats.overdue, danger: true },
          { label: 'Rejeitadas', value: stats.rejected },
          { label: 'Ciclo médio (d)', value: stats.avgCycle },
          { label: 'Aceite médio (d)', value: stats.avgAccept },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="text-xs text-muted-foreground">{kpi.label}</div>
              <div className={`text-2xl font-bold ${kpi.danger && Number(kpi.value) > 0 ? 'text-destructive' : ''}`}>
                {kpi.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Por responsável */}
      <Card>
        <CardHeader><CardTitle className="text-base">Por responsável</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Responsável</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Em aberto</TableHead>
                <TableHead className="text-right">Concluídas</TableHead>
                <TableHead className="text-right">Atrasadas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byResponsavel.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.nome}</TableCell>
                  <TableCell className="text-right">{r.total}</TableCell>
                  <TableCell className="text-right">{r.open}</TableCell>
                  <TableCell className="text-right">{r.done}</TableCell>
                  <TableCell className="text-right">
                    {r.overdue > 0 ? <Badge variant="destructive">{r.overdue}</Badge> : 0}
                  </TableCell>
                </TableRow>
              ))}
              {byResponsavel.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sem dados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Por setor */}
      <Card>
        <CardHeader><CardTitle className="text-base">Por setor</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Setor</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Concluídas</TableHead>
                <TableHead className="text-right">Atrasadas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bySetor.map(r => (
                <TableRow key={r.id}>
                  <TableCell>{r.nome}</TableCell>
                  <TableCell className="text-right">{r.total}</TableCell>
                  <TableCell className="text-right">{r.done}</TableCell>
                  <TableCell className="text-right">
                    {r.overdue > 0 ? <Badge variant="destructive">{r.overdue}</Badge> : 0}
                  </TableCell>
                </TableRow>
              ))}
              {bySetor.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sem dados</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detalhe */}
      <Card>
        <CardHeader><CardTitle className="text-base">Detalhamento ({filtered.length})</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Quadro</TableHead>
                <TableHead>Coluna</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Criada</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Entrega</TableHead>
                <TableHead className="text-right">Ciclo (d)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 200).map(p => (
                <TableRow key={p.id}>
                  <TableCell className="max-w-[240px] truncate font-medium">{p.titulo}</TableCell>
                  <TableCell>{boardMap[p.board_id] ?? '—'}</TableCell>
                  <TableCell>{p.columnName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={priorityColors[p.prioridade] ?? ''}>{p.prioridade}</Badge>
                  </TableCell>
                  <TableCell>{profileMap[p.responsavel_id ?? ''] ?? '—'}</TableCell>
                  <TableCell>{setorMap[p.setor_id ?? ''] ?? '—'}</TableCell>
                  <TableCell>{format(parseISO(p.created_at), 'dd/MM/yy', { locale: ptBR })}</TableCell>
                  <TableCell className={p.overdue ? 'text-destructive font-medium' : ''}>
                    {p.prazo ? format(parseISO(p.prazo), 'dd/MM/yy') : '—'}
                  </TableCell>
                  <TableCell>{p.data_entrega ? format(parseISO(p.data_entrega), 'dd/MM/yy') : '—'}</TableCell>
                  <TableCell className="text-right">{p.cycleDays ?? '—'}</TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground">Sem pendências</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {filtered.length > 200 && (
            <p className="mt-2 text-xs text-muted-foreground">Mostrando 200 de {filtered.length}. Exporte CSV para ver todas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
