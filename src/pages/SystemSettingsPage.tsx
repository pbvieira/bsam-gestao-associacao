import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/main-layout';
import { PageLayout } from '@/components/layout/page-layout';
import { UnifiedRoute } from '@/components/auth/unified-route';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSystemSettings } from '@/hooks/use-system-settings';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Loader2, Save } from 'lucide-react';

export default function SystemSettingsPage() {
  const { settings, loading, updateSetting } = useSystemSettings();
  const { toast } = useToast();
  const { hasCapability } = useAuth();
  const canWrite = hasCapability('system_settings.write');
  const [totalVagas, setTotalVagas] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings.total_vagas) setTotalVagas(settings.total_vagas);
  }, [settings.total_vagas]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateSetting('total_vagas', totalVagas);
    setSaving(false);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Configuração salva', description: 'A capacidade foi atualizada.' });
    }
  };

  return (
    <UnifiedRoute module="system_settings" action="read">
      <MainLayout>
        <PageLayout
          title="Configurações Gerais"
          subtitle="Gerencie parâmetros globais do sistema"
        >
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid gap-6 max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle>Capacidade de Alunos</CardTitle>
                  <CardDescription>
                    Defina o número total de vagas disponíveis para alunos internados na instituição.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="total_vagas">Total de vagas</Label>
                    <Input
                      id="total_vagas"
                      type="number"
                      min="0"
                      value={totalVagas}
                      onChange={(e) => setTotalVagas(e.target.value)}
                      className="max-w-xs"
                      disabled={!canWrite}
                    />
                  </div>
                  <Button onClick={handleSave} disabled={saving || !canWrite}>
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Salvar
                  </Button>
                  {!canWrite && (
                    <p className="text-xs text-muted-foreground">
                      Você não tem permissão para editar configurações do sistema.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </PageLayout>
      </MainLayout>
    </UnifiedRoute>
  );
}
