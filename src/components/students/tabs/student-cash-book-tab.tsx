import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Wallet,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useStudentCashBook,
  ENTRADA_CATEGORIES,
  SAIDA_CATEGORIES,
  type CashBookTransaction,
} from '@/hooks/use-student-cash-book';
import { CashBookTransactionDialog } from './cash-book-transaction-dialog';

interface StudentCashBookTabProps {
  studentId: string | null;
}

const ALL_CATEGORIES = [...ENTRADA_CATEGORIES, ...SAIDA_CATEGORIES];

const getCategoryLabel = (value: string) => {
  const cat = ALL_CATEGORIES.find((c) => c.value === value);
  return cat?.label || value;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function StudentCashBookTab({ studentId }: StudentCashBookTabProps) {
  const { toast } = useToast();
  const {
    transactions,
    loading,
    totalEntradas,
    totalSaidas,
    saldoAtual,
    addTransaction,
    updateTransaction,
    deleteTransaction,
  } = useStudentCashBook(studentId || undefined);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<CashBookTransaction | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterCategoria, setFilterCategoria] = useState<string>('todas');

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (filterTipo !== 'todos' && t.tipo_movimento !== filterTipo) return false;
      if (filterCategoria !== 'todas' && t.categoria !== filterCategoria) return false;
      return true;
    });
  }, [transactions, filterTipo, filterCategoria]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, CashBookTransaction[]> = {};
    filteredTransactions.forEach((t) => {
      if (!groups[t.data_movimento]) {
        groups[t.data_movimento] = [];
      }
      groups[t.data_movimento].push(t);
    });
    return groups;
  }, [filteredTransactions]);

  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => b.localeCompare(a));

  const handleAddNew = () => {
    setEditingTransaction(null);
    setDialogOpen(true);
  };

  const handleEdit = (transaction: CashBookTransaction) => {
    setEditingTransaction(transaction);
    setDialogOpen(true);
  };

  const handleSave = async (data: any) => {
    if (editingTransaction) {
      const result = await updateTransaction(editingTransaction.id, data);
      if (result.error) {
        toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        return { error: result.error };
      }
      toast({ title: 'Sucesso', description: 'Transação atualizada!' });
    } else {
      const result = await addTransaction(data);
      if (result.error) {
        toast({ title: 'Erro', description: result.error, variant: 'destructive' });
        return { error: result.error };
      }
      toast({ title: 'Sucesso', description: 'Transação adicionada!' });
    }
    return { error: null };
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    const result = await deleteTransaction(deletingId);
    if (result.error) {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
    } else {
      toast({ title: 'Sucesso', description: 'Transação removida!' });
    }
    setDeletingId(null);
  };

  if (!studentId) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Salve o cadastro do aluno primeiro para acessar o livro caixa.
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Entradas</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">
              {formatCurrency(totalEntradas)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ArrowDownCircle className="h-5 w-5 text-red-500" />
              <span className="text-sm text-muted-foreground">Saídas</span>
            </div>
            <p className="text-2xl font-bold text-red-600 mt-1">
              {formatCurrency(totalSaidas)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Saldo Atual</span>
            </div>
            <p className={`text-2xl font-bold mt-1 ${saldoAtual >= 0 ? 'text-primary' : 'text-red-600'}`}>
              {formatCurrency(saldoAtual)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Livro Caixa
            </CardTitle>
            <Button onClick={handleAddNew} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Nova Transação
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filtros:</span>
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-[140px] h-8">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="entrada">Entradas</SelectItem>
                <SelectItem value="saida">Saídas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategoria} onValueChange={setFilterCategoria}>
              <SelectTrigger className="w-[160px] h-8">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                {ALL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Transactions List */}
          {sortedDates.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {transactions.length === 0
                ? 'Nenhuma transação registrada.'
                : 'Nenhuma transação encontrada com os filtros selecionados.'}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedDates.map((date) => (
                <div key={date}>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {format(parseISO(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="space-y-2 ml-6">
                    {groupedTransactions[date].map((t) => (
                      <div
                        key={t.id}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          t.tipo_movimento === 'entrada'
                            ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900'
                            : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {t.tipo_movimento === 'entrada' ? (
                            <ArrowUpCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <ArrowDownCircle className="h-5 w-5 text-red-600" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {getCategoryLabel(t.categoria)}
                              </Badge>
                            </div>
                            {t.descricao && (
                              <p className="text-sm text-muted-foreground mt-0.5">
                                {t.descricao}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-semibold ${
                              t.tipo_movimento === 'entrada' ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {t.tipo_movimento === 'entrada' ? '+' : '-'} {formatCurrency(t.valor)}
                          </span>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(t)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeletingId(t.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Dialog */}
      <CashBookTransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={editingTransaction}
        onSave={handleSave}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.
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
    </div>
  );
}
