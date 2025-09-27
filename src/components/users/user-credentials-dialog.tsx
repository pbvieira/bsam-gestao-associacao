import { useState } from 'react';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { UserProfile } from '@/hooks/use-auth';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, KeyRound, AlertTriangle } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.object({
  email: z.string().email('Email inválido'),
});

interface UserCredentialsDialogProps {
  user: UserProfile;
  onClose: () => void;
}

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

export function UserCredentialsDialog({ user, onClose }: UserCredentialsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const { handleError, handleSuccess } = useErrorHandler();

  const handlePasswordReset = async () => {
    setLoading(true);
    try {
      // Buscar o email do usuário na tabela auth.users via função personalizada
      const { data: userEmail, error: emailError } = await supabase
        .rpc('get_user_email' as any, {
          user_uuid: user.user_id
        });

      if (emailError || !userEmail) {
        throw new Error('Email do usuário não encontrado. Solicite ao usuário para redefinir sua senha usando "Esqueci minha senha".');
      }

      const { error } = await supabase.auth.resetPasswordForEmail(userEmail as string, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      handleSuccess(
        'Email de redefinição enviado com sucesso!',
        'Redefinir Senha'
      );
      
      onClose();
    } catch (error: any) {
      handleError(error, 'auth');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail.trim()) {
      handleError('Digite o novo email', 'validation');
      return;
    }

    try {
      const validation = emailSchema.parse({ email: newEmail });
      setEmailLoading(true);

      // Atualizar email via Supabase Auth Admin
      const { error } = await supabase.auth.updateUser({
        email: validation.email,
      });

      if (error) throw error;

      handleSuccess(
        'Um email de confirmação foi enviado para o novo endereço. O usuário deve confirmar para completar a alteração.',
        'Alteração de Email'
      );

      setNewEmail('');
      onClose();
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        handleError(error.errors[0].message, 'validation');
      } else {
        handleError(error, 'auth');
      }
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Gerenciar Credenciais</DialogTitle>
          <DialogDescription>
            Alterar email e senha de {user.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do usuário */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{user.full_name}</CardTitle>
                <Badge variant={getRoleBadgeVariant(user.role)}>
                  {getRoleLabel(user.role)}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          {/* Redefinir senha */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                Redefinir Senha
              </CardTitle>
              <CardDescription className="text-xs">
                Enviar email para o usuário redefinir a senha
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePasswordReset}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Enviando...' : 'Enviar Email de Reset'}
              </Button>
            </CardContent>
          </Card>

          {/* Alterar email */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Alterar Email
              </CardTitle>
              <CardDescription className="text-xs">
                Alterar o email de login do usuário
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-email" className="text-xs">Novo Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  placeholder="novo@email.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="h-8"
                />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEmailChange}
                disabled={emailLoading || !newEmail.trim()}
                className="w-full"
              >
                {emailLoading ? 'Alterando...' : 'Alterar Email'}
              </Button>
            </CardContent>
          </Card>

          {/* Aviso importante */}
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-amber-800 font-medium">Importante:</p>
                  <p className="text-xs text-amber-700">
                    As alterações de email requerem confirmação do usuário. 
                    Para alterações de senha, o usuário receberá um link por email.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de ação */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}