import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/hooks/use-auth';
import { useAuth } from '@/hooks/use-auth';
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
import { Search, Edit, Trash2, UserPlus, KeyRound, UserX } from 'lucide-react';
import { UserForm } from './user-form';
import { UserCredentialsDialog } from './user-credentials-dialog';
import { useToast } from '@/hooks/use-toast';

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
  const [showCredentials, setShowCredentials] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [adminCount, setAdminCount] = useState<number>(0);
  const { handleError } = useErrorHandler();
  const { toast } = useToast();
  const { canAccess, profile } = useAuth();

  const canCreate = canAccess('users');
  const canUpdate = canAccess('users');
  const canDelete = canAccess('users');

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

  // Buscar contagem de administradores ativos
  useEffect(() => {
    const fetchAdminCount = async () => {
      try {
        const { data: count, error } = await supabase
          .rpc('count_active_admins');
        
        if (!error && count !== null) {
          setAdminCount(count);
        }
      } catch (error) {
        console.error('Erro ao buscar contagem de administradores:', error);
      }
    };

    fetchAdminCount();
  }, [users]); // Atualizar quando os dados mudarem

  const handleEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setShowUserForm(true);
  };

  const handleCredentials = (user: UserProfile) => {
    setSelectedUser(user);
    setShowCredentials(true);
  };

  const handleDeactivate = async (user: UserProfile) => {
    try {
      // Verificar se é administrador e se é o último
      if (user.role === 'administrador') {
        const { data: adminCount, error: countError } = await supabase
          .rpc('count_active_admins');

        if (countError) {
          console.error('Erro ao contar administradores:', countError);
          toast({
            title: "Erro",
            description: "Não foi possível verificar os administradores do sistema.",
            variant: "destructive",
          });
          return;
        }

        if (adminCount <= 1) {
          toast({
            title: "Ação não permitida",
            description: "Não é possível desativar o último administrador do sistema. Deve haver pelo menos um administrador ativo.",
            variant: "destructive",
          });
          return;
        }
      }

      if (!confirm(`Tem certeza que deseja desativar o usuário ${user.full_name}?`)) {
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ active: false })
        .eq('id', user.id);

      if (error) throw error;
      
      toast({
        title: "Usuário desativado",
        description: "O usuário foi desativado com sucesso.",
      });
      
      refetch();
    } catch (error) {
      handleError(error, 'database');
    }
  };

  const handlePermanentDelete = async (user: UserProfile) => {
    try {
      const firstConfirm = confirm(
        `⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!\n\n` +
        `Você está prestes a EXCLUIR PERMANENTEMENTE o usuário:\n` +
        `${user.full_name}\n\n` +
        `Todos os dados associados a este usuário serão removidos do sistema.\n\n` +
        `Deseja continuar?`
      );

      if (!firstConfirm) return;

      const secondConfirm = confirm(
        `Digite "EXCLUIR" para confirmar a exclusão permanente do usuário ${user.full_name}.\n\n` +
        `Esta é sua última chance de cancelar!`
      );

      if (!secondConfirm) return;

      // Chamar Edge Function para exclusão segura
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId: user.user_id }
      });

      if (error) throw error;

      if (data?.success === false) {
        toast({
          title: "Erro ao excluir",
          description: data.error || "Não foi possível excluir o usuário.",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído permanentemente do sistema.",
      });
      
      refetch();
    } catch (error: any) {
      // Verificar tipos específicos de erro
      const errorMessage = error?.message || String(error);
      
      if (errorMessage.includes('vinculado a um cadastro de aluno')) {
        toast({
          title: "Exclusão não permitida",
          description: "Este usuário está vinculado a um cadastro de aluno. Os dados do aluno devem ser preservados.",
          variant: "destructive",
        });
      } else if (errorMessage.includes('não pode excluir seu próprio usuário')) {
        toast({
          title: "Ação não permitida",
          description: "Você não pode excluir seu próprio usuário.",
          variant: "destructive",
        });
      } else {
        handleError(error, 'database');
      }
    }
  };

  const handleFormClose = () => {
    setShowUserForm(false);
    setSelectedUser(null);
    refetch();
  };

  const handleCredentialsClose = () => {
    setShowCredentials(false);
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
            <Button
              disabled={!canCreate}
              onClick={() => setShowUserForm(true)}
            >
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
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canUpdate}
                          onClick={() => handleCredentials(user)}
                        >
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canUpdate}
                          onClick={() => handleEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        
                        {user.active && (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={!canDelete || (user.role === 'administrador' && adminCount <= 1) || user.user_id === profile?.user_id}
                            onClick={() => handleDeactivate(user)}
                            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!canDelete || (user.role === 'administrador' && adminCount <= 1) || user.user_id === profile?.user_id}
                          onClick={() => handlePermanentDelete(user)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
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

      {showCredentials && selectedUser && (
        <UserCredentialsDialog
          user={selectedUser}
          onClose={handleCredentialsClose}
        />
      )}
    </>
  );
}