import { useState } from "react";
import { useStudents } from "@/hooks/use-students";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Edit, UserCheck, UserX, Calendar, Phone, Filter, Trash2 } from "lucide-react";
import { format, differenceInYears } from "date-fns";
import { ptBR } from "date-fns/locale";

interface StudentListProps {
  onCreateStudent: () => void;
  onEditStudent: (student: any) => void;
}

export function StudentList({ onCreateStudent, onEditStudent }: StudentListProps) {
  const { students, loading, deactivateStudent, deleteStudent } = useStudents();
  const { canAccess } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("nome_completo");

  const canCreate = canAccess("students");
  const canUpdate = canAccess("students");
  const canDelete = canAccess("students");

  const filteredStudents = students
    .filter((student) => {
      // Search filter
      const searchMatch =
        searchTerm === "" ||
        student.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.codigo_cadastro.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.cpf?.includes(searchTerm) ||
        student.numero_interno?.includes(searchTerm);

      // Status filter
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "active" && student.ativo) ||
        (statusFilter === "inactive" && !student.ativo);

      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];

      if (aValue < bValue) return -1;
      if (aValue > bValue) return 1;
      return 0;
    });

  const calculateAge = (birthDate: string) => {
    return differenceInYears(new Date(), new Date(birthDate));
  };

  const calculatePermanence = (startDate: string, endDate?: string | null) => {
    const end = endDate ? new Date(endDate) : new Date();
    const start = new Date(startDate);
    const years = differenceInYears(end, start);
    const months = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30.44)) % 12;

    if (years > 0) {
      return `${years}a ${months}m`;
    }
    return `${months}m`;
  };

  const handleDeactivate = async (studentId: string) => {
    if (confirm("Tem certeza que deseja desativar este aluno?")) {
      const result = await deactivateStudent(studentId);
      if (result.error) {
        toast({
          title: "Erro ao desativar",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Aluno desativado",
          description: "O aluno foi desativado com sucesso.",
        });
      }
    }
  };

  const handlePermanentDelete = async (studentId: string, studentName: string) => {
    const firstConfirm = confirm(
      `⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\n` +
        `Você está prestes a EXCLUIR PERMANENTEMENTE o aluno:\n` +
        `${studentName}\n\n` +
        `Todos os dados associados a este aluno serão removidos do sistema, incluindo:\n` +
        `- Dados básicos e complementares\n` +
        `- Anotações e histórico\n` +
        `- Documentos anexados\n` +
        `- Contatos de emergência\n` +
        `- Informações de saúde e trabalho\n\n` +
        `Deseja continuar?`,
    );

    if (!firstConfirm) return;

    const secondConfirm = confirm(
      `Digite "EXCLUIR" para confirmar a exclusão permanente do aluno ${studentName}.\n\n` +
        `Esta é sua última chance de cancelar!`,
    );

    if (!secondConfirm) return;

    const result = await deleteStudent(studentId);
    if (result.error) {
      toast({
        title: "Erro ao excluir",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Aluno excluído",
        description: "O aluno foi excluído permanentemente do sistema.",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Ativos</p>
                <p className="text-2xl font-bold">{students.filter((s) => s.ativo).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Este Mês</p>
                <p className="text-2xl font-bold">
                  {
                    students.filter(
                      (s) => format(new Date(s.data_abertura), "yyyy-MM") === format(new Date(), "yyyy-MM"),
                    ).length
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserX className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Inativos</p>
                <p className="text-2xl font-bold">{students.filter((s) => !s.ativo).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-sm font-medium">Resultados</p>
                <p className="text-2xl font-bold">{filteredStudents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Alunos</CardTitle>
              <CardDescription>Gestão completa dos assistidos da associação</CardDescription>
            </div>
            <Button disabled={!canCreate} onClick={onCreateStudent} className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Aluno
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome, código, CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nome_completo">Nome</SelectItem>
                <SelectItem value="codigo_cadastro">Código</SelectItem>
                <SelectItem value="data_abertura">Data Cadastro</SelectItem>
                <SelectItem value="data_nascimento">Data Nascimento</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {!filteredStudents || filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum aluno encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || statusFilter !== "all"
                  ? "Tente ajustar os filtros de busca."
                  : "Comece cadastrando o primeiro aluno."}
              </p>
              {!searchTerm && statusFilter === "all" && (
                <Button disabled={!canCreate} onClick={onCreateStudent} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Cadastrar Primeiro Aluno
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Idade</TableHead>
                    <TableHead>Data Nascimento</TableHead>
                    <TableHead>Data Entrada</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{student.codigo_cadastro}</TableCell>
                      <TableCell className="font-medium">{student.nome_completo}</TableCell>
                      <TableCell>{calculateAge(student.data_nascimento)} anos</TableCell>
                      <TableCell>{format(new Date(student.data_nascimento), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>
                        {format(new Date(student.data_abertura), "dd/MM/yyyy", { locale: ptBR })}
                        {student.hora_entrada && (
                          <div className="text-xs text-muted-foreground">{student.hora_entrada}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={student.ativo ? "default" : "secondary"}>
                          {student.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {student.nome_responsavel ? (
                          <div>
                            <div className="font-medium text-sm">{student.nome_responsavel}</div>
                            {student.parentesco_responsavel && (
                              <div className="text-xs text-muted-foreground">{student.parentesco_responsavel}</div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canUpdate}
                            onClick={() => onEditStudent(student)}
                            className="gap-1"
                          >
                            <Edit className="h-3 w-3" />
                            Editar
                          </Button>

                          {student.ativo && (
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!canDelete}
                              onClick={() => handleDeactivate(student.id)}
                              className="gap-1 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                            >
                              <UserX className="h-3 w-3" />
                              Desativar
                            </Button>
                          )}

                          {/* 
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canDelete}
                            onClick={() => handlePermanentDelete(student.id, student.nome_completo)}
                            className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3 w-3" />
                            Excluir
                          </Button>
                          */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {filteredStudents && filteredStudents.length > 0 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {filteredStudents.length} aluno{filteredStudents.length !== 1 ? "s" : ""}
                {statusFilter !== "all" && ` (${statusFilter === "active" ? "ativos" : "inativos"})`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
