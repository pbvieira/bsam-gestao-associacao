import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/hooks/use-auth';
import { useErrorHandler } from '@/hooks/use-error-handler';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Edit, Trash2, UserPlus } from 'lucide-react';
import { UserForm } from './user-form';
import { UserPermissionsDialog } from './user-permissions-dialog';

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'administrador':
      return 'destructive';
    case 'diretor':
      return 'default';
    case 'coordenador':
      return 'secondary';
    case 'auxiliar':
      return 'outline';
    default:
      return 'outline';
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'administrador':
      return 'Administrador';
    case 'diretor':
      return 'Diretor';
    case 'coordenador':
      return 'Coordenador';
    case 'auxiliar':
      return 'Auxiliar';
    case 'aluno':
      return 'Aluno';
    default:
      return role;
  }
};

export function UserList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const { handleError } = useErrorHandler();

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['users', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('full_name', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as UserProfile[];
    },
    meta: {
      onError: (error: unknown) => handleError(error, 'database'),
    },
  });

  const handleEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setShowUserForm(true);
  };

  const handlePermissions = (user: UserProfile) => {
    setSelectedUser(user);
    setShowPermissions(true);
  };

  const handleDelete = async (user: UserProfile) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${user.full_name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ active: false })
        .eq('id', user.id);

      if (error) throw error;
      refetch();
    } catch (error) {
      handleError(error, 'database');
    }
  };

  const handleFormClose = () => {
    setShowUserForm(false);
    setSelectedUser(null);
    refetch();
  };

  const handlePermissionsClose = () => {
    setShowPermissions(false);
    setSelectedUser(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Usuários do Sistema</CardTitle>
              <CardDescription>
                Gerenciar usuários e suas permissões
              </CardDescription>
            </div>
            <Button onClick={() => setShowUserForm(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {!users || users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum usuário encontrado.' : 'Nenhum usuário cadastrado ainda.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data de Cadastro</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.full_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.role)}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.active ? 'default' : 'secondary'}>
                        {user.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePermissions(user)}
                        >
                          Permissões
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {showUserForm && (
        <UserForm
          user={selectedUser}
          onClose={handleFormClose}
        />
      )}

      {showPermissions && selectedUser && (
        <UserPermissionsDialog
          user={selectedUser}
          onClose={handlePermissionsClose}
        />
      )}
    </>
  );
}