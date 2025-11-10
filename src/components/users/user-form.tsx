import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole } from '@/hooks/use-auth';
import { useErrorHandler } from '@/hooks/use-error-handler';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

// Schema para novos usuários
const newUserSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  role: z.enum(['aluno', 'auxiliar', 'coordenador', 'diretor', 'administrador'] as const),
  active: z.boolean(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Senhas devem coincidir",
  path: ["confirmPassword"],
});

// Schema para edição de usuários existentes
const editUserSchema = z.object({
  full_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().optional(), // Email não é validado na edição
  role: z.enum(['aluno', 'auxiliar', 'coordenador', 'diretor', 'administrador'] as const),
  active: z.boolean(),
  password: z.string().optional(),
  confirmPassword: z.string().optional(),
});

type UserFormData = z.infer<typeof editUserSchema>;

interface UserFormProps {
  user?: UserProfile | null;
  onClose: () => void;
}

export function UserForm({ user, onClose }: UserFormProps) {
  const [loading, setLoading] = useState(false);
  const { handleError, handleSuccess } = useErrorHandler();

  // Escolher o schema baseado se é edição ou criação
  const schema = user ? editUserSchema : newUserSchema;

  const form = useForm<UserFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: user?.full_name || '',
      email: user ? undefined : '', // Undefined para edição, string vazia para criação
      role: user?.role || 'aluno',
      active: user?.active ?? true,
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: UserFormData) => {
    console.log('🔥 UserForm: onSubmit iniciado', { data, user: user?.id });
    
    setLoading(true);
    try {
      if (user) {
        console.log('🔥 UserForm: Atualizando usuário existente', { 
          userId: user.id, 
          updates: {
            full_name: data.full_name,
            role: data.role,
            active: data.active,
          }
        });

        // Update existing user
        const { data: updateResult, error } = await supabase
          .from('profiles')
          .update({
            full_name: data.full_name,
            role: data.role,
            active: data.active,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)
          .select('*');

        console.log('🔥 UserForm: Resultado da atualização', { updateResult, error });

        if (error) {
          console.error('🔥 UserForm: Erro na atualização', error);
          throw error;
        }
        
        if (!updateResult || updateResult.length === 0) {
          console.error('🔥 UserForm: Nenhuma linha foi atualizada');
          handleError('Nenhum usuário foi atualizado. Verifique as permissões.', 'database');
          return;
        }

        console.log('🔥 UserForm: Sucesso na atualização, chamando handleSuccess');
        handleSuccess('Usuário atualizado com sucesso!');
      } else {
        console.log('🔥 UserForm: Criando novo usuário via Edge Function');
        
        if (!data.password || !data.email) {
          console.error('🔥 UserForm: Email ou senha faltando');
          handleError('Email e senha são obrigatórios para novos usuários', 'auth');
          return;
        }

        // Obter token da sessão atual
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          handleError('Sessão expirada. Faça login novamente.', 'auth');
          return;
        }

        console.log('🔥 UserForm: Chamando Edge Function create-user');

        // Chamar Edge Function para criar usuário (NÃO faz login automático)
        const { data: result, error: functionError } = await supabase.functions.invoke('create-user', {
          body: {
            email: data.email,
            password: data.password,
            full_name: data.full_name,
            role: data.role,
            active: data.active
          }
        });

        console.log('🔥 UserForm: Resultado da Edge Function', { result, functionError });

        if (functionError) {
          console.error('🔥 UserForm: Erro ao chamar Edge Function', functionError);
          throw functionError;
        }

        if (result?.success) {
          console.log('🔥 UserForm: Usuário criado com sucesso (admin permanece logado)');
          handleSuccess('Usuário criado com sucesso!');
        } else {
          console.error('🔥 UserForm: Edge Function não retornou sucesso');
          handleError('Erro ao criar usuário', 'auth');
          return;
        }
      }

      console.log('🔥 UserForm: Fechando dialog');
      onClose();
    } catch (error) {
      console.error('🔥 UserForm: Erro capturado no catch', error);
      handleError(error, 'auth');
    } finally {
      console.log('🔥 UserForm: Finalizando, setLoading(false)');
      setLoading(false);
    }
  };

  const getRoleLabel = (role: UserRole) => {
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

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {user ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
          <DialogDescription>
            {user 
              ? 'Edite as informações do usuário' 
              : 'Adicione um novo usuário ao sistema'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!user && (
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Digite o email" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Função</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma função" />
                      </SelectTrigger>
                    </FormControl>
                        <SelectContent>
                          <SelectItem value="aluno">Aluno</SelectItem>
                          <SelectItem value="auxiliar">Auxiliar</SelectItem>
                          <SelectItem value="coordenador">Coordenador</SelectItem>
                          <SelectItem value="diretor">Diretor</SelectItem>
                          <SelectItem value="administrador">Administrador</SelectItem>
                        </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!user && (
              <>
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Digite a senha (mínimo 6 caracteres)" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Senha</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Confirme a senha" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Status Ativo</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Usuário pode acessar o sistema
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}