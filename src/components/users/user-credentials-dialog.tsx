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
import { Mail, KeyRound, Info } from 'lucide-react';
import { z } from 'zod';

const emailSchema = z.string().email('Email inválido');

async function extractFnError(error: any): Promise<string> {
  try {
    const res: Response | undefined = error?.context;
    if (res && typeof res.json === 'function') {
      const body = await res.clone().json();
      if (body?.error) return body.error;
    }
  } catch {}
  return error?.message || 'Erro ao chamar função';
}

interface UserCredentialsDialogProps {
  user: UserProfile;
  onClose: () => void;
}

const roleLabels: Record<string, string> = {
  administrador: 'Administrador',
  diretor: 'Diretor',
  coordenador: 'Coordenador',
  auxiliar: 'Auxiliar',
  aluno: 'Aluno',
};

const roleVariants: Record<string, 'default' | 'destructive' | 'secondary' | 'outline'> = {
  administrador: 'destructive',
  diretor: 'default',
  coordenador: 'secondary',
  auxiliar: 'outline',
};

export function UserCredentialsDialog({ user, onClose }: UserCredentialsDialogProps) {
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const { handleError, handleSuccess } = useErrorHandler();

  const handleSetPassword = async () => {
    if (newPassword.length < 6) {
      handleError('A senha deve ter ao menos 6 caracteres', 'validation');
      return;
    }
    if (newPassword !== confirmPassword) {
      handleError('As senhas não conferem', 'validation');
      return;
    }

    setPasswordLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-user-credentials', {
        body: { user_id: user.user_id, new_password: newPassword },
      });
      if (error) {
        const msg = await extractFnError(error);
        throw new Error(msg);
      }
      if ((data as any)?.error) throw new Error((data as any).error);

      handleSuccess('Senha definida com sucesso!', 'Atualizar Senha');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (error: any) {
      handleError(error, 'auth');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleEmailChange = async () => {
    const parsed = emailSchema.safeParse(newEmail.trim());
    if (!parsed.success) {
      handleError(parsed.error.errors[0].message, 'validation');
      return;
    }

    setEmailLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-update-user-credentials', {
        body: { user_id: user.user_id, new_email: parsed.data },
      });
      if (error) {
        const msg = await extractFnError(error);
        throw new Error(msg);
      }
      if ((data as any)?.error) throw new Error((data as any).error);

      handleSuccess('E-mail alterado com sucesso!', 'Alterar E-mail');
      setNewEmail('');
      onClose();
    } catch (error: any) {
      handleError(error, 'auth');
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
            Alterar e-mail e senha de {user.full_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{user.full_name}</CardTitle>
                <Badge variant={roleVariants[user.role] ?? 'outline'}>
                  {roleLabels[user.role] ?? user.role}
                </Badge>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                Definir nova senha
              </CardTitle>
              <CardDescription className="text-xs">
                A nova senha entra em vigor imediatamente.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-xs">Nova senha</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-8"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-xs">Confirmar senha</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repita a senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-8"
                  autoComplete="new-password"
                />
              </div>
              <Button
                variant="default"
                size="sm"
                onClick={handleSetPassword}
                disabled={passwordLoading || !newPassword || !confirmPassword}
                className="w-full"
              >
                {passwordLoading ? 'Salvando...' : 'Definir senha'}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Alterar e-mail
              </CardTitle>
              <CardDescription className="text-xs">
                A alteração é aplicada na hora, sem confirmação por e-mail.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="new-email" className="text-xs">Novo e-mail</Label>
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
                {emailLoading ? 'Alterando...' : 'Alterar e-mail'}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-800">
                  As alterações são aplicadas imediatamente. Não há envio de e-mails nem confirmação por parte do usuário.
                </p>
              </div>
            </CardContent>
          </Card>

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
