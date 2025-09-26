import { useState } from 'react';
import { useStudents } from '@/hooks/use-students';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Plus, 
  Edit, 
  UserCheck, 
  UserX, 
  Calendar,
  Phone
} from 'lucide-react';
import { format, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StudentListProps {
  onCreateStudent: () => void;
  onEditStudent: (student: any) => void;
}

export function StudentList({ onCreateStudent, onEditStudent }: StudentListProps) {
  const { students, loading, deactivateStudent } = useStudents();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(student =>
    student.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.codigo_cadastro.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.cpf?.includes(searchTerm) ||
    student.numero_interno?.includes(searchTerm)
  );

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
    if (confirm('Tem certeza que deseja desativar este aluno?')) {
      await deactivateStudent(studentId);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, código, CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Button onClick={onCreateStudent} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Aluno
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Ativos</p>
                <p className="text-2xl font-bold">{students.filter(s => s.ativo).length}</p>
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
                  {students.filter(s => 
                    format(new Date(s.data_abertura), 'yyyy-MM') === format(new Date(), 'yyyy-MM')
                  ).length}
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
                <p className="text-2xl font-bold">{students.filter(s => !s.ativo).length}</p>
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

      {/* Student Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{student.nome_completo}</CardTitle>
                  <p className="text-sm text-muted-foreground font-mono">
                    {student.codigo_cadastro}
                  </p>
                </div>
                <Badge variant={student.ativo ? "default" : "secondary"}>
                  {student.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-muted-foreground">Idade</p>
                  <p className="font-medium">{calculateAge(student.data_nascimento)} anos</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Permanência</p>
                  <p className="font-medium">
                    {calculatePermanence(student.data_abertura, student.data_saida)}
                  </p>
                </div>
              </div>
              
              <div className="text-sm">
                <p className="text-muted-foreground">Entrada</p>
                <p className="font-medium">
                  {format(new Date(student.data_abertura), 'dd/MM/yyyy', { locale: ptBR })}
                  {student.hora_entrada && ` às ${student.hora_entrada}`}
                </p>
              </div>

              {student.nome_responsavel && (
                <div className="text-sm">
                  <p className="text-muted-foreground">Responsável</p>
                  <p className="font-medium">
                    {student.nome_responsavel}
                    {student.parentesco_responsavel && ` (${student.parentesco_responsavel})`}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEditStudent(student)}
                  className="flex-1 gap-2"
                >
                  <Edit className="h-3 w-3" />
                  Editar
                </Button>
                
                {student.ativo && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeactivate(student.id)}
                    className="gap-2 text-orange-600 hover:text-orange-700"
                  >
                    <UserX className="h-3 w-3" />
                    Desativar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <UserCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum aluno encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Comece cadastrando o primeiro aluno.'}
            </p>
            {!searchTerm && (
              <Button onClick={onCreateStudent} className="gap-2">
                <Plus className="h-4 w-4" />
                Cadastrar Primeiro Aluno
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}